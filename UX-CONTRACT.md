# Avenir restored interaction contract

Authority: preserve the original user HTML and all UI/features. Allowed visual changes are right-axis chart zoom and a trading-photo background retaining pointer/touch response. Gemini, live-data adapters and accounts are additive.

- Select/Listbox: native controls are canonical; retain platform keyboard/popup behavior.
- Date: native controls retain original interaction.
- Forms: original .fld controls; new auth forms use inline status and masked secrets.
- Toast: original toast plus Gemini notice helpers own feedback.
- Chart: original canvas engine, drawing tools, indicators and Terminal remain owners. Add only scale gestures/reset/buttons.
- Gemini: chat and code drafts; explicit insertion and the existing Terminal Run action remain separate. Other languages copy/download.
- Accounts: Supabase Auth, owner-only private records and workspace revision checks. Community posts use explicit authenticated writes and publicly show display names, never private account email.
- Secrets: Vault only; browser backups contain no provider keys. Auth sessions use the Supabase SDK.
- Data: real Binance crypto; Massive/Barchart/Finnhub and MT5 require connections/entitlements. No invented missing prices or Greeks.
- Scheduling: research/code generation only, with per-user limits and saved results; no arbitrary server programs or broker orders.
- Static audit limitations: the analyzer cannot follow many original inline/delegated bindings or bindAction. Original textarea behavior is intentionally preserved per the user's instruction. Runtime checks are separate evidence.

## Dedicated account and language routes
- User-approved update: login is the first route. Signup proceeds through details, review, then real Supabase email confirmation. Passwords stay only in form/in-memory signup state and never enter URLs, backups or local storage. Recovery has its own page.
- The top-left menu owns Account, AvScript guide and Notifications. Gemini no longer owns the account screen. Original market/chart/Terminal layouts remain canonical.
- AvScript supports chart plots, options snapshot filters, backtesting and explicitly started session monitoring. notify() aliases alert(); signal notifications are deduplicated by script, symbol, timeframe and completed bar. Monitoring stops on signout/error and has no broker-execution authority.
- Saved notifications are owner-only. Browser notifications require explicit user permission and a running page; closed-app push is not configured. Scheduled Gemini results create inbox notifications server-side.
- Alpha Vantage and crypto have durable shared caches and atomic refresh leases. Crypto broadcasts are private, authenticated, server-published channels with no client insert policy. Public data access is separate from private account authorization. No claim of 100k-user validation or redistribution licensing is made.

## Options Lab additions
- User-authorized graphs and expanded options research live in an additive Options Lab page; original chart and Options layouts remain intact.
- The lab explicitly separates BTC/ETH Deribit inverse-settled contracts from US equity and GC futures options. Premium/settlement and quantity units are visible in chain, graphs and strategy builder.
- Missing values remain unavailable. Estimated expected move and payout-minimizing strike are labeled models. Scenario extrema are bounded to the displayed interval and are never called global maximum risk.
- Native controls, existing fields/buttons and shared showExtra page owner remain canonical. Tables paginate at 25 rows; charts have accessible SVG titles and data tooltips. Saved legs use private workspace persistence; undo protects local edits. No trading endpoint is used.
- Snapshot preview is a separate local read-only component harness with public captured fixtures. It does not bypass production authentication or claim live updates. Publication of these additions is pending hosting credit reset.
