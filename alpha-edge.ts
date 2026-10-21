import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'apikey,content-type,authorization,x-avenir-worker', 'Content-Type': 'application/json' };
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers });
const stocks = ['AAPL', 'MSFT', 'NVDA', 'AMZN', 'GOOGL', 'META', 'TSLA', 'SPY', 'QQQ', 'DIA', 'IWM'];
const pairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD', 'EURGBP', 'EURJPY', 'GBPJPY'];
const extras = ['NEWS_SENTIMENT', 'TOP_GAINERS_LOSERS', 'OVERVIEW', 'ETF_PROFILE', 'INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'EARNINGS', 'EARNINGS_ESTIMATES', 'DIVIDENDS', 'SPLITS', 'HISTORICAL_OPTIONS', 'REALTIME_OPTIONS', 'EARNINGS_CALENDAR', 'IPO_CALENDAR', 'LISTING_STATUS', 'MARKET_STATUS', 'WTI', 'BRENT', 'NATURAL_GAS', 'COPPER', 'ALUMINUM', 'WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE', 'ALL_COMMODITIES', 'REAL_GDP', 'REAL_GDP_PER_CAPITA', 'TREASURY_YIELD', 'FEDERAL_FUNDS_RATE', 'CPI', 'INFLATION', 'RETAIL_SALES', 'DURABLES', 'UNEMPLOYMENT', 'NONFARM_PAYROLL'];
async function run(query: Record<string, string>) {
  const id = new URLSearchParams(query).toString();
  const { data: slot, error } = await db.rpc('avenir_alpha_reserve', { p_id: id });
  if (error) throw new Error('Data cache unavailable.');
  if (slot.cached) return { ...slot.data, cached: true, fetched_at: slot.fetched_at };
  if (!slot.reserved) {
    if (slot.data) return { ...slot.data, stale: true, warning: slot.error, fetched_at: slot.fetched_at };
    throw new Error(slot.error);
  }
  const { data: key, error: keyError } = await db.rpc('avenir_alpha_secret');
  if (keyError || !key) throw new Error('Alpha Vantage is not configured.');
  const url = new URL('https://www.alphavantage.co/query');
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  url.searchParams.set('apikey', key);
  let result: any;
  try {
    const { data: wait, error: paceError } = await db.rpc('avenir_alpha_pace');
    if (paceError || wait < 0) throw new Error();
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) throw new Error();
    const raw = await res.text();
    let data: any;
    try { data = JSON.parse(raw); } catch { data = { csv: raw }; }
    const message = data['Error Message'] || data.Note || data.Information;
    result = message ? { error: String(message).replaceAll(key, '[redacted]') } : { data };
  } catch { result = { error: 'Alpha Vantage could not be reached. Try again later.' }; }
  const fetched_at = new Date().toISOString();
  result = { ...result, source: 'Alpha Vantage', query, fetched_at, remaining: slot.remaining, note: 'Daily/historical data unless the dataset explicitly reports otherwise. Provider entitlement applies.' };
  // Cache denials too: repeated page visits must not consume the daily quota.
  const midnight = Date.parse(new Date(Date.now()+86400000).toISOString().slice(0,10)+'T00:00:00Z');
  const ttl = result.error && /per second|burst/i.test(result.error) ? 120000 : midnight-Date.now();
  await db.from('avenir_alpha_cache').update({ data: result, fetched_at, expires_at: new Date(Date.now() + ttl).toISOString(), lease_until: null }).eq('id', id);
  return result;
}
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  try {
    if (req.method !== 'POST') return reply({ error: 'POST required.' }, 405);
    const body = await req.json();
    if (body.op === 'warm') {
      const { data: token } = await db.rpc('avenir_cron_key');
      if (!token || req.headers.get('x-avenir-worker') !== token) return reply({error:'Unauthorized.'},401);
      const task = async () => {
        const queries = stocks.slice(0,9).map(symbol=>({function:'TIME_SERIES_DAILY',symbol}));
        for (const s of pairs.slice(0,6)) queries.push({function:'FX_DAILY',from_symbol:s.slice(0,3),to_symbol:s.slice(3)} as any);
        queries.push({function:'GOLD_SILVER_HISTORY',symbol:'XAU',interval:'daily'} as any,{function:'GOLD_SILVER_HISTORY',symbol:'XAG',interval:'daily'} as any,{function:'WTI',interval:'daily'} as any,{function:'NEWS_SENTIMENT',limit:'50'} as any,{function:'EARNINGS_CALENDAR',horizon:'3month'} as any);
        for(const query of queries) { try {await run(query);} catch { /* Existing cached datasets remain usable. */ } }
      };
      // Supabase keeps the daily refresh alive after acknowledging the scheduler.
      (globalThis as any).EdgeRuntime.waitUntil(task());
      return reply({queued:true});
    }
    if (body.op === 'cached') {
      const { data, error } = await db.from('avenir_alpha_cache').select('id,data,fetched_at').not('data', 'is', null);
      if (error) throw new Error('Cache unavailable.');
      const budget = await db.from('avenir_alpha_budget').select('used').eq('day', new Date().toISOString().slice(0, 10)).maybeSingle();
      return reply({ datasets: data, used: budget.data?.used || 0, limit: 25 });
    }
    const symbol = String(body.symbol || 'AAPL').toUpperCase();
    let query: Record<string, string>;
    if (body.op === 'daily') {
      if (stocks.includes(symbol)) query = { function: 'TIME_SERIES_DAILY', symbol };
      else if (pairs.includes(symbol)) query = { function: 'FX_DAILY', from_symbol: symbol.slice(0, 3), to_symbol: symbol.slice(3) };
      else if (['XAUUSD', 'XAGUSD'].includes(symbol)) query = { function: 'GOLD_SILVER_HISTORY', symbol: symbol.slice(0, 3), interval: 'daily' };
      else if (symbol === 'USOIL') query = { function: 'WTI', interval: 'daily' };
      else throw new Error('Select a supported stock, ETF, metal, oil or forex pair.');
    } else {
      const fn = String(body.dataset);
      if (!extras.includes(fn)) throw new Error('Unsupported dataset.');
      query = { function: fn };
      if (['OVERVIEW', 'ETF_PROFILE', 'INCOME_STATEMENT', 'BALANCE_SHEET', 'CASH_FLOW', 'EARNINGS', 'EARNINGS_ESTIMATES', 'DIVIDENDS', 'SPLITS', 'HISTORICAL_OPTIONS', 'REALTIME_OPTIONS'].includes(fn)) {
        if (!stocks.includes(symbol)) throw new Error('Select a supported stock or ETF.');
        query.symbol = symbol;
      }
      if (fn === 'NEWS_SENTIMENT') query.limit = '50';
      if (['WTI', 'BRENT', 'NATURAL_GAS', 'COPPER', 'ALUMINUM', 'WHEAT', 'CORN', 'COTTON', 'SUGAR', 'COFFEE', 'ALL_COMMODITIES'].includes(fn)) query.interval = 'daily';
      if (fn === 'EARNINGS_CALENDAR') query.horizon = '3month';
    }
    return reply(await run(query));
  } catch (e) { return reply({ error: e instanceof Error ? e.message : 'Data request failed.' }, 400); }
});
