# Options Lab and free APIs

Status: the authenticated `avenir-free-data` backend is deployed on AVENIR. The new frontend is prepared locally, not published: AppDeploy refused deployment instructions because the daily credit balance is below its minimum. The existing public website remains on version 1792590032460. New deployments resume 2026-10-22 at 00:00 UTC / 03:00 Africa/Nairobi. No paid service or new account was purchased or opened.

## Free feeds verified

| Provider | Actual result | Coverage / limits |
|---|---|---|
| Deribit public API | BTC chain: 888 instruments; ETH chain: 766 instruments; selected ticker returned delta, gamma, theta, vega and rho | BTC/ETH native-coin-settled options only; venue data, not US stock or GC futures options |
| Frankfurter | Six USD-based daily rates and 181 EUR/USD daily history points | Official/reference daily rates; no live broker quotes or OHLC bars |
| Existing Binance feed | Existing shared crypto quotes/history remain intact | Spot crypto |
| Existing Alpha Vantage key | Existing shared daily stocks/ETFs/commodity cache remains intact | 25/day shared budget; premium endpoints remain unavailable |

GitHub discovery: https://github.com/public-apis/public-apis#finance lists Frankfurter and Tradier. Official open-source Deribit clients: https://github.com/deribit/deribit-api-clients. Provider documentation: https://frankfurter.dev/ and https://docs.deribit.com/api-reference/market-data/public-get_book_summary_by_currency.

Tradier's official documentation states that sandbox stock/options quotes are delayed 15 minutes, Greeks are unavailable in sandbox, and real-time access requires a brokerage account. It is not connected and was not represented as a free keyless feed. No verified single free API covers every market, real-time US equity options and GC options requested for Avenir.

## Prepared features

- Separate Options Lab entry from the top-left menu and original Options toolbar; original UI is retained.
- Expiry selection and BTC/ETH chain scanner, calls/puts filter, OI/24h-volume/spread filters, pagination and CSV export.
- OI by strike, rolling 24h volume by strike, mark-IV smile, ATM-IV term structure, put/call OI by expiry and liquidity-spread graphs.
- Expiry/strike OI heatmap, expected-move approximation and native-coin payout-minimizing strike analysis.
- Selected-contract exchange Greeks; missing values remain unavailable.
- Up to eight legs, nine real-quote strategy templates, editable side/quantity/premium, undo, private workspace saving, exact inverse-settlement break-evens and expiry P/L scenarios.
- Daily forex reference line chart and free-API coverage page.

Premiums and settlement for the connected Deribit contracts are BTC/ETH. Quantity is underlying coin amount, not 100-share equity lots. Expiry P/L uses signed quantity × (USD intrinsic / terminal USD spot − entry coin premium). Chart extrema apply only to the displayed scenario interval; they are not global maximum profit/loss. Fees, margin, slippage and liquidation are excluded. OI/rolling volume are not directional options flow. All tools are research/simulation; they do not execute trades.

## Caching and security

Shared refresh leases/cache are reused across users. Option summaries cache for 30 seconds, selected tickers 15 seconds, instrument metadata six hours, forex references/history one day. A service-only shared budget limits upstream free-feed requests to 90 per minute. Client calls require a valid Supabase user; internal verification uses the existing service worker credential. No provider key is needed for either new public API. No secret is included in the preview or source files.

## Review today

Open Options-Lab-Preview.html directly in a browser. It embeds the component, logo, styles and five real captured datasets, so no local server is needed. It does not call providers, authenticate, place orders or touch private user records. EUR/USD history and one selected Greek ticker are included in the offline snapshot; the prepared app supports all six pairs and valid BTC/ETH tickers. Local-port browser inspection was blocked by the environment; syntax and real-data SVG/component assertions passed, but no visual browser pass is claimed.

Calculations/syntax tests: work/test-options-lab.cjs checks inverse-settlement P/L, exact call/put break-evens, offsetting positions, invalid inputs, missing OI, crossed quotes and all nine template types. Full authenticated production UI testing and publication remain blocked by hosting credits/absence of an authorized signed-in Avenir QA session.
