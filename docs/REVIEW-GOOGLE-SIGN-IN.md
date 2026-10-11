# Google sign-in for SpareCycle Review

The selected login route is personal Google OAuth through Supabase. It is not managed company SSO, a Google Workspace domain restriction, SCIM provisioning or proof of an enterprise identity policy. A successful login identifies the user; existing organization membership, roles, invitations and independent-approval rules still decide access. Neither a Gmail address nor a claimed company domain grants membership.

## Operator configuration

Create a Web application OAuth client in Google Auth Platform. Configure the intended audience and consent details, using only `openid`, email and profile scopes. Register the application origin `https://sparecycle-topaz.vercel.app` and the Supabase callback `https://thgataxgbgqmhuehozxm.supabase.co/auth/v1/callback`. Store the client ID/secret in Supabase's Google provider settings. The Google secret does not belong in the Review browser or repository. Allow the application's `/review` return URL in Supabase Auth. [Official Google provider setup](https://supabase.com/docs/guides/auth/social-login/auth-google).

Set server-only `REVIEW_GOOGLE_SIGN_IN_ENABLED=true` after the provider is configured. `GET /api/review` exposes `googleSignInEnabled` only when the operator flag is exactly `true` and valid Supabase URL/publishable-key configuration exists. This flag enables the login choice; it is not a live connectivity test. Its default is false. The frontend initiates `auth.signInWithOAuth` with provider `google` and the intended return URL, then uses the normal Supabase session and Review API.

If Google restricts the OAuth app to testing, its permitted audience must include the intended pilot accounts. A completed login and a usable authenticated Review request must be observed before calling the integration live. Provider creation, consent configuration and an enabled flag alone are insufficient.

## Membership and account behavior

Supabase can link eligible identities sharing a verified email to an existing user. Application authorization still uses the stable Supabase user UUID and membership rows; there is no email-domain membership rule. Test both an invited user and an unrelated account. Confirm the unrelated account sees no organization, cannot read a known organization's records, and gains access only through an authorized explicit invitation. [Supabase identity-linking behavior](https://supabase.com/docs/guides/auth/auth-identity-linking).

Keep the existing password/account-recovery path available during rollout. Google sign-in does not establish that custom SMTP, confirmation mail, password recovery delivery or production redirect settings have been verified. Those checks remain in the [company setup guide](REVIEW-COMPANY-SETUP.md).

## Managed enterprise SSO is separate work

Supabase's current project SAML feature requires Pro or above. It needs company IdP metadata, a registered connection and completed company login testing. SAML users may be separate UUIDs even when they share an email with an existing password account. Custom OAuth/OIDC providers are another route: Free projects currently support up to three, with an issuer, client credentials and callback configuration supplied by the company. [Project SAML requirements](https://supabase.com/docs/guides/auth/enterprise-sso/auth-sso-saml), [custom OAuth/OIDC limits and setup](https://supabase.com/docs/guides/auth/custom-oauth-providers).

Neither route is enabled or enforced by this Google login flag. The application now includes a separately configurable custom OIDC login choice, disabled until a company provider is connected. See [company account access](REVIEW-ENTERPRISE-AUTH.md) for its settings, email templates and required live checks. Future enforcement needs verified session-to-provider binding, explicit member enrollment, audit records and a tested owner recovery path. Editable user metadata, an email domain, or a currently linked provider alone is insufficient proof of which provider authenticated a session. No SSO enforcement migration or plan upgrade accompanies this change.
