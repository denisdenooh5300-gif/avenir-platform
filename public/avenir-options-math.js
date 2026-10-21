/* Pure analytics for native-coin-settled European options. No broker execution. */
(function(root){
  'use strict';
  const finite = v => typeof v === 'number' && Number.isFinite(v);
  const sum = values => values.every(finite) ? values.reduce((a,b)=>a+b,0) : null;
  function spread(row){return finite(row.bid)&&finite(row.ask)&&row.ask>=row.bid&&row.ask>0 ? (row.ask-row.bid)/((row.ask+row.bid)/2)*100 : null;}
  function payout(legs,spot){
    if(!finite(spot)||spot<=0)throw new Error('Scenario spot must be positive.');
    return legs.reduce((total,l)=>{
      if(!['C','P'].includes(l.type)||!finite(l.strike)||l.strike<=0||!finite(l.premium)||l.premium<0||!finite(l.qty)||l.qty<=0||![1,-1].includes(l.side))throw new Error('Invalid option leg.');
      const intrinsic=l.type==='C'?Math.max(spot-l.strike,0):Math.max(l.strike-spot,0);
      return total+l.side*l.qty*(intrinsic/spot-l.premium);
    },0);
  }
  function breakEvens(legs){
    if(!legs.length)return [];
    payout(legs,1);
    const cuts=[0,...new Set(legs.map(l=>l.strike))].sort((a,b)=>a-b);cuts.push(Infinity);
    const roots=[];
    for(let i=0;i<cuts.length-1;i++){
      const lo=cuts[i],hi=cuts[i+1],mid=Number.isFinite(hi)?(lo+hi)/2:lo+Math.max(lo,1);
      let a=0,b=0;
      for(const l of legs){const q=l.side*l.qty;a-=q*l.premium;if(l.type==='C'&&mid>l.strike){a+=q;b-=q*l.strike;}if(l.type==='P'&&mid<l.strike){a-=q;b+=q*l.strike;}}
      if(Math.abs(a)<1e-14)continue;
      const x=-b/a;
      if(x>0&&x>=lo-1e-8&&x<=hi+1e-8&&!roots.some(v=>Math.abs(v-x)<1e-6))roots.push(x);
    }
    return roots.sort((a,b)=>a-b);
  }
  function summarize(rows,spot){
    const calls=rows.filter(r=>r.type==='C'),puts=rows.filter(r=>r.type==='P');
    const callOI=sum(calls.map(r=>r.oi)),putOI=sum(puts.map(r=>r.oi));
    const callVol=sum(calls.map(r=>r.volume)),putVol=sum(puts.map(r=>r.volume));
    const nearest=rows.filter(r=>finite(r.iv)&&r.iv>0&&finite(r.strike)).sort((a,b)=>Math.abs(a.strike-spot)-Math.abs(b.strike-spot)).slice(0,2);
    const iv=nearest.length?nearest.reduce((v,r)=>v+r.iv,0)/nearest.length:null;
    let pain=null;
    if(rows.length&&rows.every(r=>finite(r.oi))&&rows.reduce((v,r)=>v+r.oi,0)>0){
      let best=Infinity;
      for(const s of new Set(rows.map(r=>r.strike))){if(!(s>0))continue;const value=rows.reduce((v,r)=>v+r.oi*(r.type==='C'?Math.max(s-r.strike,0):Math.max(r.strike-s,0))/s,0);if(value<best){best=value;pain=s;}}
    }
    return {callOI,putOI,callVol,putVol,pcrOI:finite(callOI)&&callOI>0&&finite(putOI)?putOI/callOI:null,pcrVolume:finite(callVol)&&callVol>0&&finite(putVol)?putVol/callVol:null,iv,maxPain:pain,contracts:rows.length,quoted:rows.filter(r=>finite(spread(r))).length};
  }
  function template(rows,name,spot){
    const strikes=[...new Set(rows.map(r=>r.strike))].sort((a,b)=>a-b);if(strikes.length<3)throw new Error('Not enough listed strikes for this strategy.');
    const center=strikes.reduce((a,b)=>Math.abs(a-spot)<Math.abs(b-spot)?a:b),i=strikes.indexOf(center);
    const lo=strikes[Math.max(0,i-1)],hi=strikes[Math.min(strikes.length-1,i+1)];
    const farLo=strikes[Math.max(0,i-2)],farHi=strikes[Math.min(strikes.length-1,i+2)];
    const specs={call:[['C',center,1]],put:[['P',center,1]],straddle:[['C',center,1],['P',center,1]],strangle:[['P',lo,1],['C',hi,1]],bullCall:[['C',center,1],['C',hi,-1]],bearPut:[['P',center,1],['P',lo,-1]],ironCondor:[['P',farLo,1],['P',lo,-1],['C',hi,-1],['C',farHi,1]],ironFly:[['P',lo,1],['P',center,-1],['C',center,-1],['C',hi,1]],butterfly:[['C',lo,1],['C',center,-1,2],['C',hi,1]]}[name];
    if(!specs)throw new Error('Choose a strategy template.');
    if(name==='butterfly'&&Math.abs((center-lo)-(hi-center))>1e-8)throw new Error('The butterfly template requires equally spaced listed strikes.');
    if(['bullCall','bearPut','strangle','ironCondor','ironFly','butterfly'].includes(name)&&new Set(specs.map(s=>s[1])).size< (name==='ironCondor'?4:name==='ironFly'||name==='butterfly'?3:2))throw new Error('Choose an expiry with more surrounding strikes.');
    return specs.map(([type,strike,side,qty])=>{const row=rows.find(r=>r.type===type&&r.strike===strike);if(!row)throw new Error('A required contract is not listed.');const premium=side===1?row.ask:row.bid;if(!finite(premium)||premium<=0)throw new Error('A required contract has no positive bid/ask. Add legs manually with your own price assumptions.');return {instrument:row.instrument,type,strike,side,qty:qty||1,premium,expiry:row.expiry};});
  }
  const api={finite,spread,payout,breakEvens,summarize,template};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.AvenirOptionsMath=api;
})(typeof window==='object'?window:globalThis);
