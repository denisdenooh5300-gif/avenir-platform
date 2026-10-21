# Avenir account and automation update

The website now opens on login. Account creation has separate details, review and email confirmation pages. The top-left menu owns account management, the AvScript guide and Notifications. Supabase's Site URL and exact redirect allowlist were changed to the Avenir website after the user approved this authentication configuration change.

The user-provided Gemini key is encrypted in Vault, never in public code. A real Gemini Flash-Lite request returned HTTP 200 and a valid response. The shared key has an atomic global cap of 50 requests per UTC day; the existing per-user quota also applies. Users can save their own provider keys separately. This cap protects usage; it is not a provider billing guarantee.

AvScript is the existing C++-style bounded interpreter, extended with notify() as an alert alias and an explicitly started session monitoring loop. Saved programs can combine real option snapshots with chart series, draw indicators, simulate strategy signals and produce notifications. Runtime tests passed for option volume/OI filtering plus chart output, alerts, and stopping an infinite loop. Scripts do not place broker orders. Session monitoring requires the page to remain running, and sleeping browsers can pause it.

Notifications are stored in an owner-only Supabase inbox. Scheduled Gemini task completion/failure adds an inbox item on the server. Browser notifications require explicit browser permission and a running page. Closed-app push delivery is not configured.

Crypto quotes now use a durable server cache and an atomic lease per dataset. A single scheduled refresh runs every 15 seconds; history is cached by symbol/timeframe. Server-only private broadcasts deliver shared quote payloads to authenticated clients, avoiding one provider call per visitor. Client broadcast publishing is denied. Alpha Vantage retains its shared daily cache/budget. A lease test confirmed that a second claimant reuses the first claimant's lease. No 100,000-user load test or commercial data redistribution entitlement is implied.

Verification: login-first page and separate signup page were checked in the live browser; required fields block empty signup. Site URL and the single allowed redirect were visibly saved. Existing authenticated workspace/guide/chat/inbox interactions were not tested with an invented production account. User signup and email confirmation require the user's real email.

Deployment 1792590032460 is live. A subsequent two-part fix (preserve PASSWORD_RECOVERY during initial session restoration; clear notification memory and refresh channel authentication across account changes) is saved in public/avenir-pages.js but was blocked by AppDeploy's daily hosting-credit minimum. It is not live. The provider resumes deployments at 2026-10-22 00:00 UTC, which is 03:00 Africa/Nairobi. Password-recovery completion should not be considered fully verified until that fix is deployed. Normal login/signup pages are live; no automated future deployment was scheduled.

Security advisor: service-only cache/credential/budget tables intentionally have RLS with no client policies. Existing pg_net schema and disabled leaked-password protection warnings remain. No password-security settings were weakened.
