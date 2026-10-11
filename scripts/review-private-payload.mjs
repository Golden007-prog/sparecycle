// Shared authenticated transport for private repository execution. No private key or plaintext is logged.
import { constants, createCipheriv, createDecipheriv, createHash, createPrivateKey, createPublicKey, privateDecrypt, publicEncrypt, randomBytes } from 'node:crypto';

const deny = () => { throw new Error('The private verification envelope is invalid or does not match this runner.'); };
const digest = value => createHash('sha256').update(value).digest('hex');
const fields = ['version', 'organizationId', 'repository', 'repositoryId', 'installationId', 'runnerSha', 'bindingHash', 'keyFingerprint', 'nonce'];
const exact = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
export function privatePayloadContext(context) {
  if (!exact(context, fields) || context.version !== 1 || !/^[a-f0-9-]{36}$/i.test(context.organizationId) || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(context.repository) || !Number.isSafeInteger(context.repositoryId) || context.repositoryId < 1 || !Number.isSafeInteger(context.installationId) || context.installationId < 1 || !/^[a-f0-9]{40}$/.test(context.runnerSha) || !/^[a-f0-9]{64}$/.test(context.bindingHash) || !/^[a-f0-9]{64}$/.test(context.keyFingerprint) || !/^[a-f0-9]{32}$/.test(context.nonce)) deny();
  return JSON.stringify(Object.fromEntries(fields.map(key => [key, context[key]])));
}
export function privateKeyFingerprint(pem) {
  try {
    const key = createPublicKey(pem);
    if (key.asymmetricKeyType !== 'rsa' || (key.asymmetricKeyDetails?.modulusLength ?? 0) < 3072 || (key.asymmetricKeyDetails?.modulusLength ?? 0) > 4096) deny();
    return digest(key.export({ type: 'spki', format: 'der' }));
  } catch { deny(); }
}
export function sealPrivatePayload(plaintext, publicKeyPem, context) {
  let key;
  try {
    if (typeof plaintext !== 'string' || Buffer.byteLength(plaintext, 'utf8') > 42_000 || privateKeyFingerprint(publicKeyPem) !== context.keyFingerprint) deny();
    const aad = privatePayloadContext(context);
    key = randomBytes(32); const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
    cipher.setAAD(Buffer.from(aad, 'utf8'));
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const envelope = JSON.stringify({ version: 1, algorithm: 'RSA-OAEP-SHA256/AES-256-GCM', context: JSON.parse(aad), wrappedKey: publicEncrypt({ key: publicKeyPem, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, key).toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') });
    if (Buffer.byteLength(envelope, 'utf8') > 60_000) deny();
    return envelope;
  } catch { deny(); } finally { key?.fill(0); }
}
export function openPrivatePayload(envelopeText, privateKeyPem, expected) {
  let key;
  try {
    if (typeof envelopeText !== 'string' || Buffer.byteLength(envelopeText, 'utf8') > 60_000 || !exact(expected, ['repository', 'repositoryId', 'runnerSha', 'nonce'])) deny();
    const envelope = JSON.parse(envelopeText);
    if (!exact(envelope, ['version', 'algorithm', 'context', 'wrappedKey', 'iv', 'tag', 'ciphertext']) || envelope.version !== 1 || envelope.algorithm !== 'RSA-OAEP-SHA256/AES-256-GCM') deny();
    const context = envelope.context; const aad = privatePayloadContext(context);
    if (context.repository.toLowerCase() !== expected.repository.toLowerCase() || context.repositoryId !== expected.repositoryId || context.runnerSha !== expected.runnerSha || context.nonce !== expected.nonce || privateKeyFingerprint(privateKeyPem) !== context.keyFingerprint) deny();
    const decode = (value, min, max) => {
      if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) deny();
      const bytes = Buffer.from(value, 'base64');
      if (bytes.length < min || bytes.length > max || bytes.toString('base64') !== value) deny();
      return bytes;
    };
    key = privateDecrypt({ key: createPrivateKey(privateKeyPem), padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, decode(envelope.wrappedKey, 384, 512));
    if (key.length !== 32) deny();
    const decipher = createDecipheriv('aes-256-gcm', key, decode(envelope.iv, 12, 12), { authTagLength: 16 });
    decipher.setAAD(Buffer.from(aad, 'utf8')); decipher.setAuthTag(decode(envelope.tag, 16, 16));
    const plaintext = Buffer.concat([decipher.update(decode(envelope.ciphertext, 1, 42_000)), decipher.final()]);
    const text = plaintext.toString('utf8');
    if (Buffer.byteLength(text, 'utf8') !== plaintext.length) deny();
    return { plaintext: text, context, envelopeHash: digest(envelopeText) };
  } catch { deny(); } finally { key?.fill(0); }
}
