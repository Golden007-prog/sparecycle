# Company account access

SpareCycle Review supports email/password accounts with confirmation and recovery, personal Google sign-in when enabled, and an optional company OIDC login connection. These are sign-in choices. Organization membership, explicit invitations and server-side roles continue to decide access. A verified email domain does not enroll a person into an organization.

## Company signup email

Configure a custom SMTP provider in the SpareCycle Supabase project's Authentication settings. Supply the SMTP hostname, port, username, password and verified sender identity there, never in Vercel's public environment or source files. Confirm the provider permits application authentication mail, meets the expected traffic volume, and has the sender/domain authentication required by that provider. Gmail SMTP can support a small explicitly authorized pilot but is not a bulk company mail service. [Supabase SMTP configuration](https://supabase.com/docs/guides/auth/auth-smtp).

Set the Supabase Auth Site URL to the deployed application's origin and allow the exact production return URL `https://sparecycle-topaz.vercel.app/review`. The browser uses this canonical path for signup, confirmation resend, recovery and OAuth return; incoming `next` parameters, hashes and credentials are not forwarded. Keep email confirmation enabled. Do not disable confirmation to make an undelivered email appear to succeed.

Once custom SMTP is configured, install these templates:

| Supabase email | Subject | File |
| --- | --- | --- |
| Confirm signup | Confirm your SpareCycle account | `supabase/templates/confirmation.html` |
| Reset password | Recover your SpareCycle account | `supabase/templates/recovery.html` |

The templates show `{{ .Token }}` and link to the ordinary app return URL `{{ .RedirectTo }}`. They deliberately omit `{{ .ConfirmationURL }}`: email security products can prefetch and consume that one-time verification link. The application verifies confirmation codes with type `email` and password recovery codes with type `recovery`. A successful recovery code opens the new-password form; a failed or expired code never does. The form supports the Auth service's 6–10 digit code lengths; the usual default is six. [Email template variables and prefetching](https://supabase.com/docs/guides/auth/auth-email-templates), [verifyOtp API](https://supabase.com/docs/reference/javascript/auth-verifyotp).

Fresh Free projects using Supabase's default mailer cannot customize templates after the June 2026 policy change. Custom SMTP is the supported route; upgrading the project is not required solely for templates. [Supabase changelog](https://supabase.com/changelog).

UI feedback avoids claiming inbox delivery or revealing whether another person's email account exists. Resend requests have a one-minute browser cooldown; the Auth service still enforces its server-side limits. Password recovery requires a live verified session and a 12–128 character matching new password. Existing confirmation/recovery links remain supported, but PKCE links should be opened in the browser that started the request; email codes support another device.

## Google sign-in

Google is configured separately using the built-in Google provider and the server-only `REVIEW_GOOGLE_SIGN_IN_ENABLED=true` switch. The user's current selection is Google sign-in now and company SSO ready for a later connection. An operator flag is not a successful login test. See [Google provider setup](REVIEW-GOOGLE-SIGN-IN.md). Personal Google OAuth must not be described as enforced company SSO.

## Optional company OIDC connection

Create an OIDC application with the company's identity provider. The company's administrator supplies its HTTPS issuer, client ID and client secret. In Supabase, create a custom provider using OIDC auto-discovery, then copy the callback URL shown by that provider's setup screen into the IdP registration. Keep PKCE and nonce verification enabled. Limit requested scopes to `openid email profile`; no source-code, mail or directory write scope is required.

Store the issuer and client secret only in Supabase provider settings. The Review deployment needs these non-secret operator settings:

```dotenv
REVIEW_SSO_ENABLED=false
REVIEW_SSO_PROVIDER_ID=custom:company
REVIEW_SSO_DISPLAY_NAME=Company SSO
```

Set the enabled flag to exactly `true` only after the external provider is configured. `GET /api/review` exposes either `ssoProvider: { id, label }` or `null`. IDs must use the `custom:` prefix, lowercase provider characters and at most 50 characters. The display name is bounded to 48 characters. Missing, malformed or disabled settings hide the company sign-in option. The client invokes Supabase `signInWithOAuth` with that provider and the canonical Review return URL. The existing Google and email choices remain available.

Supabase Free supports up to three custom providers; SAML project connections require Pro or above. No plan upgrade or SAML connection is included here. [Custom OIDC setup and limits](https://supabase.com/docs/guides/auth/custom-oauth-providers), [project SAML prerequisites](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml).

This deployment exposes one optional company provider. It does not implement per-organization mandatory SSO, domain discovery, SCIM, automatic deprovisioning or logout across a company's other applications. Strong SSO enforcement needs trusted session authentication provenance, enrollment policy and a tested owner recovery path; neither editable user metadata nor a linked provider list proves which provider authenticated the current session.

## Acceptance evidence required before an integration is called live

1. Use a consented QA inbox to create an account. Observe the actual confirmation mail, complete its code in a fresh browser, and make an authenticated organization request.
2. Request a recovery email, use its code, choose a new password and verify the old password no longer signs in. Confirm invalid and reused codes cannot unlock recovery.
3. Observe a real Google/IdP round trip and authenticated Review request. Cancelled consent and callback errors should show neutral recovery guidance.
4. Confirm an invited member can access only the intended organization. Confirm an unrelated signed-in user cannot access a known organization's data or authorize a job.
5. Record only timestamps, success/failure and sanitized identifiers. Do not retain passwords, codes, mail links, provider tokens or client secrets in screenshots, traces or public evidence.

Unit tests prove validation, redirect construction, provider calls and failure behavior. They do not prove SMTP delivery, a company's IdP enrollment policy or an actual external SSO round trip. Record live provider checks separately in the deployment validation log.
