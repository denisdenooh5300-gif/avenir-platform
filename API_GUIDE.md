# Avenir connections

Open **Gemini → Account** to create an account or sign in, then **Connections** to save keys. Each user owns their own encrypted provider keys.

| Connection | Supplies |
| --- | --- |
| Google Gemini API | Chat, code drafts and scheduled research/code generation. |
| Massive / Polygon | US stocks/ETFs, equity options/Greeks, news, forex and gold/silver; your plan must include each dataset and desired delay. |
| Barchart OnDemand | GC futures options and underlying quotes, with appropriate plan access. |
| Finnhub | Actual economic and earnings calendar entries, subject to plan access. |
| MT5 bridge | Your broker's exact gold, forex, silver and oil symbols. Configure aliases in AVENIR_SYMBOLS. |
| Binance public spot | The displayed crypto pairs, already connected without a user key. |

Missing or unsupported data stays unavailable. A faster refresh setting does not remove provider delays. Previous-session Volume/OI is a liquidity filter, not live trade flow.

AvScript drafts can be inserted into the original Terminal and reviewed before running. Python, MQL5, Pine Script and JavaScript drafts can be copied/downloaded for their own runtimes. Scheduled tasks generate reports or code on Supabase; they do not execute arbitrary programs or place broker orders. Limits: 10 tasks, 100 combined Gemini requests per rolling 24 hours. Keep the MT5 terminal/bridge running for fresh broker inputs.

For account emails, set the website URL in **Supabase → Authentication → URL Configuration** as Site URL and an allowed redirect URL. Confirm email, then return to sign in. Email delivery and actual sign-in need testing with your own account.

Original element IDs/order and original CSS passed preservation checks. JavaScript parsing and chart scale tests passed. Browser checks confirmed original logos, real BTCUSDT candles, scale controls, Gemini panel/account form and a pointer-driven photo transform. Anonymous private requests returned HTTP 401; client access to credentials was denied.

Actual sign-in submission was not tested: automatic review rejected the optional dummy-credential attempt. Gemini and paid-provider calls await your keys. The static UI audit flags original/delegated bindings and preserved textareas it cannot resolve; it is not reported as a clean pass. Supabase notes the intentional service-only credential table and the existing non-relocatable pg_net extension-location warning.
