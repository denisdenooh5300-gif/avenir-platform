/* Alpha Vantage adds data to the original interface; credentials stay on Supabase. */
const ALPHA = { cache: new Map(), pending: new Map(), requested: new Map(), options: {}, used: 0 };
async function alphaRequest(body) {
  const res = await fetch(AVR.url + '/functions/v1/avenir-alpha', {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: AVR.publishable },
    body: JSON.stringify(body), signal: AbortSignal.timeout(35000)
  });
  const value = await res.json();
  if (!res.ok || value.error) throw new Error(value.error || 'Alpha Vantage data unavailable.');
  return value;
}
function alphaIngest(result) {
  if (!result?.query || !result.data) return;
  const q = result.query, data = result.data;
  ALPHA.cache.set(new URLSearchParams(q).toString(), result);
  const symbol = q.function === 'FX_DAILY' ? q.from_symbol + q.to_symbol : q.function === 'GOLD_SILVER_HISTORY' ? q.symbol + 'USD' : q.function === 'WTI' ? 'USOIL' : q.symbol;
  const series = data['Time Series (Daily)'] || data['Time Series FX (Daily)'];
  if (series && U[symbol] && !AVR.state?.market?.payload?.quotes?.[symbol]) {
    const bars = Object.entries(series).map(([date, r]) => ({ t: Date.parse(date + 'T12:00:00Z') / 1000, o: +r['1. open'], h: +r['2. high'], l: +r['3. low'], c: +r['4. close'], v: r['5. volume'] === undefined ? NaN : +r['5. volume'] })).filter(b => [b.t,b.o,b.h,b.l,b.c].every(Number.isFinite)).sort((a,b) => a.t-b.t);
    if (bars.length) {
      BARS[symbol + '|1D'] = bars;
      const weeks = new Map();
      bars.forEach(b => { const d = new Date(b.t*1000); d.setUTCDate(d.getUTCDate() - (d.getUTCDay()+6)%7); const k = d.toISOString().slice(0,10), old = weeks.get(k); if (old) { old.h=Math.max(old.h,b.h);old.l=Math.min(old.l,b.l);old.c=b.c;old.v+=b.v; } else weeks.set(k,{...b}); });
      BARS[symbol + '|1W'] = [...weeks.values()];
      LIVE[symbol] = bars.at(-1).c; OPEN[symbol] = bars.at(-2)?.c ?? NaN;
      AVR.sources[symbol] = { source: 'Alpha Vantage · daily close', timestamp: new Date(bars.at(-1).t*1000).toISOString(), note: 'End-of-day OHLC. Forex volume unavailable. Weekly bars aggregate the available daily history.' };
      if (chart?.sym === symbol && ['1D','1W'].includes(chart.tf)) chart.setSymbol(symbol,chart.tf,chart.N>0);
      if (prev?.sym === symbol && ['1D','1W'].includes(prev.tf)) prev.setSymbol(symbol,prev.tf,prev.N>0);
    }
  }
  if (['GOLD_SILVER_HISTORY','WTI'].includes(q.function) && Array.isArray(data.data)) {
    const points = data.data.map(r => ({date:r.date,value:Number(r.value ?? r.price)})).filter(r => Number.isFinite(r.value)).sort((a,b)=>a.date.localeCompare(b.date));
    if (points.length && !AVR.state?.market?.payload?.quotes?.[symbol]) {
      LIVE[symbol] = points.at(-1).value; OPEN[symbol] = points.at(-2)?.value ?? NaN;
      AVR.sources[symbol] = { source: 'Alpha Vantage · commodity reference', timestamp: points.at(-1).date + 'T00:00:00Z', note: 'Reference price, distinct from broker CFD/futures prices. No OHLC candles are synthesized from close-only data.' };
    }
  }
  if (q.function === 'EARNINGS_CALENDAR' && data.csv) {
    const lines = data.csv.trim().split(/\r?\n/).map(r=>r.split(',')), header=lines.shift(), si=header.indexOf('symbol'), di=header.indexOf('reportDate');
    if (si>=0 && di>=0) for (const r of lines) { const d=new Date(r[di]+'T12:00:00'); if (!Number.isFinite(+d)) continue; const key=dk(d), title=r[si]+' earnings · Alpha Vantage'; const bucket=AVR.calendar[key] ||= []; if(!bucket.some(e=>e.t===title)) bucket.push({k:'e',t:title}); }
  }
  if (q.function === 'HISTORICAL_OPTIONS' && Array.isArray(data.data)) ALPHA.options[q.symbol] = result;
}
async function alphaGet(body) {
  const key=JSON.stringify(body);
  if (ALPHA.pending.has(key)) return ALPHA.pending.get(key);
  const promise=alphaRequest(body).then(r=>{ alphaIngest(r); if(!r.cached && Number.isFinite(r.remaining)) ALPHA.used=Math.max(ALPHA.used,25-r.remaining); alphaStatus(); return r; }).finally(()=>ALPHA.pending.delete(key));
  ALPHA.pending.set(key,promise); return promise;
}
function alphaStatus(message='') { el('alpha-status').textContent = message || 'Connected securely · '+ALPHA.used+'/25 daily requests reserved · cached datasets are reused. Daily data is not live.'; }
const alphaOldDataStatus = updateDsrc;
updateDsrc = function() { alphaOldDataStatus(); if(!LV.on) el('apiSt').textContent='Binance crypto live · Alpha Vantage stocks, ETFs, forex and commodities: daily/reference data'; };
updateDsrc();
const alphaDatasetNames = ['NEWS_SENTIMENT','TOP_GAINERS_LOSERS','OVERVIEW','ETF_PROFILE','INCOME_STATEMENT','BALANCE_SHEET','CASH_FLOW','EARNINGS','EARNINGS_ESTIMATES','DIVIDENDS','SPLITS','HISTORICAL_OPTIONS','REALTIME_OPTIONS','EARNINGS_CALENDAR','IPO_CALENDAR','LISTING_STATUS','MARKET_STATUS','WTI','BRENT','NATURAL_GAS','COPPER','ALUMINUM','WHEAT','CORN','COTTON','SUGAR','COFFEE','ALL_COMMODITIES','REAL_GDP','REAL_GDP_PER_CAPITA','TREASURY_YIELD','FEDERAL_FUNDS_RATE','CPI','INFLATION','RETAIL_SALES','DURABLES','UNEMPLOYMENT','NONFARM_PAYROLL'];
el('provider-status').insertAdjacentHTML('afterend', `<div style="border-top:1px solid var(--ln);margin-top:18px;padding-top:14px"><h3>Alpha Vantage</h3><p class="gem-hint" id="alpha-status">Loading saved market datasets…</p><p class="gem-hint">Stocks/ETFs and forex: daily candles and weekly aggregation. Commodity reference quotes, market news and earnings feed the original pages. Other datasets open below. Intraday and options may require a premium subscription.</p><label class="gem-field">Dataset<select class="fld" id="alpha-dataset">${alphaDatasetNames.map(v=>`<option>${v}</option>`).join('')}</select></label><label class="gem-field">Symbol<select class="fld" id="alpha-symbol">${UNI.filter(u=>['stock','etf'].includes(u[2])).map(u=>`<option>${u[0]}</option>`).join('')}</select></label><button class="btn g s" id="alpha-load">Load dataset</button><p class="gem-hint">A new or expired dataset uses one shared API request. Each result is cached for 24 hours. Unavailable subscriptions show the provider response.</p><div id="alpha-result" style="max-height:420px;overflow:auto"></div></div>`);
function alphaRender(value) {
  const data=value.data, area=el('alpha-result');
  area.replaceChildren();
  const note=document.createElement('p');note.className='gem-hint';note.textContent=value.source+' · fetched '+value.fetched_at+(value.stale?' · stale cache':'');area.append(note);
  const pre=document.createElement('pre');pre.style.cssText='white-space:pre-wrap;overflow-wrap:anywhere;font-size:12px';pre.textContent=(data.csv || JSON.stringify(data,null,2)).slice(0,100000);area.append(pre);
  const download=document.createElement('button');download.className='btn g s';download.textContent='Download full result';download.onclick=()=>{const url=URL.createObjectURL(new Blob([data.csv||JSON.stringify(data,null,2)],{type:data.csv?'text/csv':'application/json'}));const a=document.createElement('a');a.href=url;a.download=value.query.function+(data.csv?'.csv':'.json');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};area.append(download);
}
bindAction('alpha-load',async()=>{ alphaStatus('Loading requested dataset…');try { const r=await alphaGet({op:'dataset',dataset:el('alpha-dataset').value,symbol:el('alpha-symbol').value}); alphaRender(r);notice('Alpha Vantage result loaded.','success'); } catch(e){alphaStatus(e.message);throw e;} });
const alphaOldRequestBars=window.AV_REQUEST_BARS;
window.AV_REQUEST_BARS=async function(symbol,tf) {
  if (U[symbol]?.t==='crypto' || LV.on || AVR.state?.market?.payload?.quotes?.[symbol]) return alphaOldRequestBars(symbol,tf);
  if (!['stock','etf','forex','metal','energy'].includes(U[symbol]?.t)) return;
  if (!['1D','1W'].includes(tf)) { el('apiSt').textContent='Alpha Vantage daily data connected · select 1D or 1W. Intraday needs a separate entitled feed.'; return; }
  if (Date.now()-(ALPHA.requested.get(symbol)||0)<60000) return;
  ALPHA.requested.set(symbol,Date.now());
  try {await alphaGet({op:'daily',symbol});renderWL();if(cur==='markets')renderMk();}catch(e){el('apiSt').textContent=e.message;}
};
const alphaOldClock=window.AV_CLOCK;
window.AV_CLOCK=()=>AVR.sources[ST.sym]?.source.startsWith('Alpha Vantage') ? AVR.sources[ST.sym].source+' · as of '+AVR.sources[ST.sym].timestamp?.slice(0,10) : alphaOldClock();
const alphaOldRenderNews=renderNews;
renderNews=async function(){
  if(LV.on)return alphaOldRenderNews();
  const body=el('mBody');body.innerHTML='<p class="mut">Loading Alpha Vantage headlines…</p>';
  try{const r=await alphaGet({op:'dataset',dataset:'NEWS_SENTIMENT'});body.innerHTML='<div class="feed" style="max-width:900px;margin:0">'+(r.data.feed||[]).map(n=>`<article class="post glass"><div class="mut">${esc(n.source||'')} · ${esc(n.time_published||'')}</div><h3><a href="${/^https?:\/\//.test(n.url||'')?esc(n.url):'#'}" target="_blank" rel="noopener noreferrer">${esc(n.title)}</a></h3><p class="mut">${esc(n.summary||'')}</p><div class="tag">${esc(n.overall_sentiment_label||'Sentiment unavailable')}</div></article>`).join('')+'</div>';}catch(e){body.textContent=e.message;}
};
const alphaOldCalendarShow=onShow.calendar;
onShow.calendar=function(){alphaOldCalendarShow?.();alphaGet({op:'dataset',dataset:'EARNINGS_CALENDAR'}).then(()=>renderCal()).catch(e=>alphaStatus(e.message));};
const alphaOldChain=window.AV_CHAIN;
window.AV_CHAIN=function(symbol,dte){
  const result=ALPHA.options[symbol];if(!result)return alphaOldChain(symbol,dte);
  const expiry=EXP[OP.exp]?.d?.toISOString().slice(0,10), num=v=>v!==undefined&&v!==''&&Number.isFinite(+v)?+v:NaN;
  const rows=result.data.data.filter(r=>r.expiration===expiry).map(r=>({details:{strike_price:num(r.strike),contract_type:r.type},greeks:{delta:num(r.delta),gamma:num(r.gamma),theta:num(r.theta),vega:num(r.vega)},implied_volatility:num(r.implied_volatility),open_interest:num(r.open_interest),day:{volume:num(r.volume),close:num(r.last)},last_quote:{bid:num(r.bid),ask:num(r.ask)}}));
  return mapChain(symbol,dte,rows);
};
async function alphaOptions(symbol){
  if(!['stock','etf'].includes(U[symbol]?.t)||LV.on)return;
  try{const r=await alphaGet({op:'dataset',dataset:'HISTORICAL_OPTIONS',symbol});const dates=[...new Set((r.data.data||[]).map(v=>v.expiration))].filter(Boolean).sort();if(!dates.length)throw new Error('No option contracts returned.');EXP.splice(0,EXP.length,...dates.map(v=>({d:new Date(v+'T12:00:00Z'),dte:Math.max(0,Math.ceil((Date.parse(v+'T23:59:59Z')-Date.now())/86400000)),monthly:false,label:v+' · historical options'})));OP.exp=0;el('oexp').innerHTML=EXP.map((v,i)=>`<option value="${i}">${esc(v.label)}</option>`).join('');renderOptions();alphaStatus('Options loaded · '+(r.data.data[0]?.date||r.fetched_at)+' · historical snapshot, not real-time flow.');}catch(e){alphaStatus(e.message);el('apiSt').textContent=e.message;}
}
const alphaOldOptionsShow=onShow.options;
onShow.options=function(){alphaOldOptionsShow?.();alphaOptions(ST.osym||ST.sym);};
const alphaOldOptionChange=el('osym').onchange;
el('osym').onchange=function(e){alphaOldOptionChange?.call(this,e);alphaOptions(this.value);};
async function alphaBoot(){
  try{const r=await alphaRequest({op:'cached'});ALPHA.used=r.used;r.datasets.forEach(row=>alphaIngest(row.data));alphaStatus();renderWL();updateHome();if(cur==='markets')renderMk();}catch(e){alphaStatus(e.message);}
}
alphaBoot();
