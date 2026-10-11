export interface PrivatePayloadContext { version: 1; organizationId: string; repository: string; repositoryId: number; installationId: number; runnerSha: string; bindingHash: string; keyFingerprint: string; nonce: string }
export function privatePayloadContext(context: PrivatePayloadContext): string;
export function privateKeyFingerprint(pem: string): string;
export function sealPrivatePayload(plaintext: string, publicKeyPem: string, context: PrivatePayloadContext): string;
export function openPrivatePayload(envelopeText: string, privateKeyPem: string, expected: { repository: string; repositoryId: number; runnerSha: string; nonce: string }): { plaintext: string; context: PrivatePayloadContext; envelopeHash: string };
