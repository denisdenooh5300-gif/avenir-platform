# Avenir platform

Saved source for the Avenir markets, options and code application. Preserves the original interface and includes the prepared Options Lab, account screens, AvScript guide, Gemini integration and Supabase adapters.

## Run and build

Requires Node.js 18 or newer. No npm packages are required. Run npm run build to assemble index.html and public assets into dist/. Publish dist/ with a static website host. For a local preview, serve dist/ with your preferred static HTTP server. Opening index.html directly from the source root will not resolve public assets.

## Backend and credentials

The frontend uses the existing AVENIR Supabase project. Provider keys remain in server-side Vault; no provider secrets or user database exports belong in this repository. The publishable Supabase browser key is intentionally public. Existing Edge Functions and database tables must remain available for authenticated features.

Before using a new domain, add its exact authentication redirect URL in Supabase and configure Site URL as appropriate. Test signup, email confirmation, password recovery, Gemini chat and private workspace access with an authorized account.

## Backup scope and status

This is source storage, not a deployment. The new Options Lab frontend has calculation and component checks, but authenticated production and visual browser verification remain pending. BTC/ETH options come from Deribit; FX reference series are daily Frankfurter data. US equity and gold futures options are not covered by those feeds.

The root *-edge.ts and schema.sql files are historical backend reference snapshots, not a complete current database migration or deployment kit. In particular workspace-edge.ts predates deployed avenir-workspace v5. Do not redeploy these references over the working backend without comparing the deployed source. free-data-edge.ts matches the prepared free-data integration. No user records or Vault contents are backed up here.

See FREE_API_OPTIONS_UPDATE.md, ACCOUNT_AUTOMATION.md and API_GUIDE.md for feature details and limitations. Those documents describe the previous host and may contain historical publication status.
