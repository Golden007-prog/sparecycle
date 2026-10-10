# SpareCycle Review interface

The interface extends SpareCycle’s existing cream, navy and cobalt identity. Its main job is to make the relationship between a laptop, its evidence and a proposed project change visible to a reviewer.

## Design plan

- Paper `#f7f7f1`, white `#ffffff`, ink `#1b3041`, cobalt `#355ee8`, soft blue `#eaf0ff`, verified green `#356651`.
- Plus Jakarta Sans for compact headings; DM Sans for controls, descriptions and evidence.
- A quiet organization rail, a wide working area and a paper-like laptop passport. The recovery change request has a sequential progress rail because its steps actually have an order.
- A laptop’s evidence version appears next to its proposed change, making stale assumptions easier to spot. Draft publication and physical repair verification remain separate states.
- The public sample is clearly synthetic. It does not fabricate a signed-in account, a connected repository, executed tests, an approved change or a published PR.

```
Organization rail | Workspace / account
                  | Recovery review heading + create action
                  | One useful introduction + evidence-to-change diagram
                  | Review queue                  | Laptop passport
                  |                               | Evidence / next action
```

Review against the brief: kept the requested established palette and typography. Avoided a generic metrics dashboard, invented fleet-health scores and decorative model badges. The main visual element is the actual evidence-to-change relationship. Motion is limited to user-driven disclosure and a reduced-motion-aware pending indicator.

## Accessibility and data boundaries

Semantic landmarks, visible keyboard focus, properly labeled forms, native modal focus handling, error and status announcements, responsive layouts and reduced-motion support are required. Asset labels are friendly names, not serial numbers. Provider API keys and GitHub app signing credentials are never entered into or returned to this interface. Workspace information comes from authenticated server endpoints; demonstration fixtures never become live records automatically.

The GitHub connection form accepts a one-time user token solely to prove repository access. It is a password field with autocomplete disabled and is cleared before the request begins. It is never stored in React state or browser storage. The app's signing key and installation tokens remain server-side. The shared verification pilot accepts public diagnostic repositories; private repositories require a dedicated approved sandbox.

## Interface checks, 10 October 2026

Checked all six public demonstration sections in Brave at desktop width and with a phone-width viewport: overview, change requests, laptop passports, projects, activity and organization settings. Search reduces the queue to the matching request; the published-status filter gives an honest empty state. Request detail shows both test runs as not executed, and investigation, verification, approval and publication are disabled in the synthetic workspace. Laptop evidence navigation preserves the supplied revision and source. The sign-in dialog fits the phone viewport. No console errors were reported during this pass. Measured page content width matched the viewport width on checked mobile sections.

The mobile navigation is hidden from focus and the accessibility tree when closed, moves focus into the opened menu and supports Escape. Laptop detail has a top-level heading. Desktop and phone screenshots were inspected through the browser capture tool. The temporary viewport override was reset after testing.

An additional authenticated browser pass used three controlled test accounts against the configured development server. The owner saw the persisted “SpareCycle integration pilot” organization, its synthetic laptop passport, evidence revision 1 and the stored parser-regression narrative. Refreshing the page preserved the session and reloaded the same laptop. The owner could access invitation and budget controls. The reviewer saw the same organization and evidence, with the reviewer role displayed and both invitation and budget changes disabled. The outsider saw no pilot organization or laptop, received the new-workspace onboarding view and could not use organization-scoped controls.

Every account was signed out before switching identities. The last account was signed out and the page returned to the clearly labeled synthetic overview. This pass made no organization, evidence, job or PR changes and triggered no model execution. The browser reported no console errors. Test-account credentials remain in the ignored local fixture and are not included in this document.

These checks cover public and authenticated UI behavior, not identity-provider email delivery, real customer hardware or real draft publication. Tenant isolation and provider execution have separate API/database tests. The local Review JSON parser now shares the API's exact 32,768-byte limit and reports the Review-specific 32 KB limit; the existing 24 KB limit for other API routes is unchanged. TypeScript validation passed after that alignment.

## Account recovery follow-up

The existing account dialog now offers recovery-email requests and signup-confirmation resend. A `PASSWORD_RECOVERY` event from the Supabase SDK opens a new-password form with a matching confirmation field. The event listener is registered before session restoration so an arriving recovery event is not missed. Updates require the recovery state, matching 12–128-character passwords and a successful live Auth user check. Password fields are cleared before submission. Expired email-link errors show fixed, safe feedback and offer new recovery/confirmation requests without reflecting provider URL text.

Ten mocked Auth tests cover request destinations, resend type, neutral email errors, password validation, expired-session rejection, actual update failure/success behavior, callback initialization ordering, observer cleanup and safe callback-error text. A browser pass checked sign-in navigation, recovery and resend forms, field focus and a synthetic expired-link callback. No real emails were sent and no test-account passwords changed. No browser console errors were reported. SMTP delivery, production redirects and the full email-to-update round trip remain operator verification gates; these mocked checks do not establish delivery.
