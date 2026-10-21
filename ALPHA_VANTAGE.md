# Alpha Vantage integration

The supplied provider key was saved in Supabase Vault. It is not included in these files or in frontend source.

Backend function `avenir-alpha` was deployed to AVENIR. Server-only cache, daily quota reservation, global request pacing and an authenticated daily refresh job were created. Anonymous database roles cannot read the secret or cache tables directly. The public function exposes only allowlisted market datasets and sanitized provider responses.

The frontend addition preserves the original HTML, styling and resources. It adds daily stock/ETF and forex OHLC, derived weekly bars, commodity reference quotes, news, earnings calendar and a dataset explorer for company financials, dividends, splits, options, economic series and commodities. Provider entitlement failures remain visible. Close-only commodity series do not generate synthetic OHLC candles. Intraday charts require an entitled feed; existing Binance crypto and MT5/Massive connections retain priority.

The free allowance is conservatively limited to 25 reserved requests per UTC day across this site. Cached datasets are shared. The server paces upstream requests to at least 1.3 seconds apart and caches subscription denials. A daily Supabase cron refresh at 00:05 UTC runs even when the website is closed. Existing usage outside the app also counts toward the provider's actual quota.

Verified: real daily histories returned for all nine existing stocks/ETFs and six forex pairs, plus gold, silver and WTI reference prices. News sentiment was explicitly denied as premium by the supplied key. Frontend JavaScript syntax checks passed; anonymous secret execution and direct cache reads were denied. Some initial concurrent test calls hit the provider burst limit; server pacing was added in response. A temporary connector outage recovered and the final frontend deployment was accepted as version 1792586375514. Deployment status and browser checks are recorded separately in the conversation.

Sources: https://www.alphavantage.co/documentation/ and https://www.alphavantage.co/support/#api-key
