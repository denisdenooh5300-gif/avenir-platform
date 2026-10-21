import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth:{persistSession:false}});
const headers = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-avenir-worker','Content-Type':'application/json'};
const response = (data:unknown,status=200) => new Response(JSON.stringify(data),{status,headers});
const currencies=['BTC','ETH'];
const pairs=['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','USDCHF'];
async function query(builder:any){const r=await builder;if(r.error)throw new Error('Shared data cache unavailable.');return r.data;}
async function get(url:string){
  if(!await query(db.rpc('avenir_free_claim')))throw new Error('Shared free-feed request budget reached. Wait a minute before retrying.');
  let r;try{r=await fetch(url,{signal:AbortSignal.timeout(20000)});}catch{throw new Error('Free data provider timed out. Cached data may be available.');}
  if(!r.ok)throw new Error('Free data provider returned HTTP '+r.status+'. Availability can depend on region and rate limits.');
  const data=await r.json();if(data.error)throw new Error('Data provider rejected the request.');return data;
}
async function cached(id:string,seconds:number,load:()=>Promise<unknown>){
  const slot=await query(db.rpc('avenir_feed_claim',{p_id:'free:'+id}));
  if(slot.cached&&slot.payload)return {...slot.payload,cached:true,age_seconds:Math.max(0,(Date.now()-Date.parse(slot.payload.fetched_at))/1000)};
  if(slot.cached)throw new Error('Dataset is being refreshed. Try again shortly.');
  try{
    const value=await load();const fetched_at=new Date().toISOString();const payload={...value as object,fetched_at};
    await query(db.from('avenir_feed_cache').upsert({id:'free:'+id,payload,fetched_at,expires_at:new Date(Date.now()+seconds*1000).toISOString(),lease_until:null}));
    return {...payload,cached:false,age_seconds:0};
  }catch(e){
    const old=await query(db.from('avenir_feed_cache').select('payload').eq('id','free:'+id).maybeSingle());
    await db.from('avenir_feed_cache').update({payload:old?.payload?{...old.payload,stale:true,warning:e instanceof Error?e.message:'Provider unavailable.'}:null,lease_until:null,expires_at:new Date(Date.now()+15000).toISOString()}).eq('id','free:'+id);
    if(old?.payload)return {...old.payload,stale:true,warning:e instanceof Error?e.message:'Provider unavailable.',age_seconds:Math.max(0,(Date.now()-Date.parse(old.payload.fetched_at))/1000)};
    throw e;
  }
}
async function instruments(currency:string){return cached('instruments:'+currency,21600,async()=>({source:'Deribit public API',data:(await get('https://www.deribit.com/api/v2/public/get_instruments?currency='+currency+'&kind=option&expired=false')).result}));}
const num=(v:unknown)=>v!==null&&v!==undefined&&v!==''&&Number.isFinite(Number(v))?Number(v):null;
Deno.serve(async req=>{
  if(req.method==='OPTIONS')return new Response('ok',{headers});
  if(req.method!=='POST')return response({error:'POST required.'},405);
  try{
    const token=(req.headers.get('Authorization')||'').replace(/^Bearer /,'');
    const user=token?(await db.auth.getUser(token)).data.user:null;
    let worker=false;
    if(req.headers.get('x-avenir-worker')){const key=await query(db.rpc('avenir_cron_key'));worker=!!key&&req.headers.get('x-avenir-worker')===key;}
    if(!user&&!worker)return response({error:'Sign in to use the free market-data feeds.'},401);
    const raw=await req.text();if(raw.length>2000)return response({error:'Request too large.'},413);
    const b=JSON.parse(raw||'{}');
    if(b.op==='options'){
      if(!currencies.includes(b.currency))return response({error:'Choose BTC or ETH.'},400);
      const currency=b.currency;
      return response(await cached('options:'+currency,30,async()=>{
        const [catalog,summary,index]=await Promise.all([instruments(currency),get('https://www.deribit.com/api/v2/public/get_book_summary_by_currency?currency='+currency+'&kind=option'),get('https://www.deribit.com/api/v2/public/get_index_price?index_name='+currency.toLowerCase()+'_usd')]);
        const meta=new Map((catalog.data||[]).filter((r:any)=>r.quote_currency===currency&&r.settlement_currency===currency&&r.instrument_type==='reversed').map((r:any)=>[r.instrument_name,r]));
        const data=(summary.result||[]).map((r:any)=>{
          const m:any=meta.get(r.instrument_name);if(!m)return null;
          return {instrument:r.instrument_name,currency,type:m.option_type==='call'?'C':'P',strike:num(m.strike),expiry:new Date(m.expiration_timestamp).toISOString(),contract_size:num(m.contract_size),min_amount:num(m.min_trade_amount),bid:num(r.bid_price),ask:num(r.ask_price),last:num(r.last),mark:num(r.mark_price),iv:num(r.mark_iv)===null?null:Number(r.mark_iv)/100,oi:num(r.open_interest),volume:num(r.volume),volume_usd:num(r.volume_usd),underlying:num(r.underlying_price),timestamp:r.creation_timestamp};
        }).filter(Boolean);
        if(!data.length)throw new Error('No native-settled option contracts returned.');
        return {source:'Deribit public API',currency,spot:index.result?.index_price,as_of:new Date(Math.max(...data.map((r:any)=>r.timestamp))).toISOString(),units:{premium:currency,settlement:currency,oi:currency+' underlying amount',volume:'rolling 24h underlying '+currency,spot:'USD'},data};
      }));
    }
    if(b.op==='ticker'){
      const instrument=String(b.instrument||'');if(!/^(BTC|ETH)-[0-9]{1,2}[A-Z]{3}[0-9]{2}-[0-9.]+-[CP]$/.test(instrument))return response({error:'Select an available option.'},400);
      const catalog=await instruments(instrument.split('-')[0]);if(!catalog.data?.some((r:any)=>r.instrument_name===instrument))return response({error:'Instrument unavailable.'},400);
      return response(await cached('ticker:'+instrument,15,async()=>({source:'Deribit public ticker',data:(await get('https://www.deribit.com/api/v2/public/ticker?instrument_name='+encodeURIComponent(instrument))).result})));
    }
    if(b.op==='fx')return response(await cached('fx',86400,async()=>({source:'Frankfurter daily official reference rates',data:await get('https://api.frankfurter.dev/v2/rates?base=USD&quotes=EUR,GBP,JPY,CHF,AUD,CAD'),note:'Daily central-bank/reference data. Not live broker quotes or OHLC candles.'})));
    if(b.op==='fx-history'){
      if(!pairs.includes(b.pair))return response({error:'Choose a supported forex pair.'},400);
      const date=new Date(Date.now()-180*86400000).toISOString().slice(0,10);
      return response(await cached('fx-history:'+b.pair,86400,async()=>({source:'Frankfurter daily official reference rates',pair:b.pair,data:await get('https://api.frankfurter.dev/v2/rates?base='+b.pair.slice(0,3)+'&quotes='+b.pair.slice(3)+'&from='+date),note:'Daily reference-rate line series; no intraday or OHLC values synthesized.'})));
    }
    return response({error:'Unsupported data request.'},400);
  }catch(e){return response({error:e instanceof Error?e.message:'Market data unavailable.'},502);}
});
