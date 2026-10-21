/* Additive integration: the original Avenir pages and chart engine remain owners. */
const AVR = {
  url: 'https://czwdcfyaangzvdbusljo.supabase.co',
  publishable: 'sb_publishable_fRAMIPHDSOyQahXaQS32Lw_eFzzWXLS',
  session: null, state: null, conversation: null, messages: [],
  sources: {}, requests: new Map(), revision: null, syncing: false,
  cloudReady: false, chatBusy: false, chatDraft: '', profile: null, calendar: {},
  futures: {}, pendingBars: 0
};
const AC = window.supabase?.createClient(AVR.url, AVR.publishable, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const el = (id) => document.getElementById(id);
const originalExpiries = EXP.slice();
const WORK_KEYS = ['wl', 'scripts', 'events', 'draw', 'inds', 'applied', 'theme', 'alerts', 'sym', 'tf', 'type', 'log', 'magnet', 'bg', 'anim'];
let restoreFocus = null, syncTimer = null;

document.querySelector('.top').insertAdjacentHTML('beforeend', '<button class="btn g s" id="gemini-open" aria-expanded="false" aria-controls="gemini-panel">✦ <span class="gem-top-text">Gemini</span></button>');
el('ctb').insertAdjacentHTML('beforeend', '<button class="cb" id="gemini-chart">✦ Gemini</button><button class="cb" id="scale-reset" title="Restore automatic price scaling">Auto scale</button><button class="cb" id="scale-plus" aria-label="Zoom price scale in">Y +</button><button class="cb" id="scale-minus" aria-label="Zoom price scale out">Y −</button>');
el('sHelp').insertAdjacentHTML('afterend', '<button class="btn g s" id="gemini-code">✦ Ask Gemini</button>');
document.body.insertAdjacentHTML('beforeend', `
<aside class="glass" id="gemini-panel" aria-label="Gemini workspace">
 <div class="row" style="justify-content:space-between"><h3>Gemini</h3><button class="btn g s" id="gemini-close">Close</button></div>
 <div class="seg gem-tabs" id="gemini-tabs"><button class="on" data-gemtab="chat">Chat</button><button data-gemtab="tasks">Automate</button><button data-gemtab="connections">Connections</button><button data-gemtab="account">Account</button></div>
 <div class="gem-body">
  <section class="gem-tab on" data-gempane="chat">
   <div class="row"><select class="fld" id="gem-conversations" aria-label="Conversation" style="flex:1;width:150px"><option value="">New conversation</option></select><button class="btn g s" id="gem-new">New chat</button></div>
   <div class="gem-chat-list" id="gem-messages"><p class="gem-hint">Chat about your chart, ask for code, or plan a research task. Sign in and save your Gemini key to begin.</p></div>
   <div class="gem-split"><label class="gem-field">Mode<select class="fld" id="gem-mode"><option value="chat">Chat & analysis</option><option value="code">Write code</option></select></label><label class="gem-field">Code language<select class="fld" id="gem-language"><option>AvScript</option><option>Python</option><option>MQL5</option><option>Pine Script</option><option>JavaScript</option></select></label></div>
   <label class="gem-field">Message<textarea class="fld" id="gem-prompt" maxlength="16000" placeholder="Ask Gemini…"></textarea></label>
   <label class="row gem-hint"><input type="checkbox" id="gem-context" checked> Include current chart data and Terminal code</label>
   <div class="row"><button class="btn" id="gem-send">Send</button><button class="btn g s" id="gem-refresh-chat">Refresh history</button></div>
   <p class="gem-hint">Generated code is a draft. Insert AvScript in the existing Terminal to review and run it. Python, MQL5 and Pine Script can be copied or downloaded.</p>
  </section>
  <section class="gem-tab" data-gempane="tasks">
   <h3>Scheduled tasks</h3><p class="gem-hint">Generate research or code on Supabase while this website is closed. Tasks do not execute arbitrary programs or place broker orders.</p>
   <label class="gem-field">Task name<input class="fld" id="job-title" maxlength="90" placeholder="Gold session report"></label>
   <label class="gem-field">Instructions<textarea class="fld" id="job-instructions" maxlength="16000" placeholder="Describe what Gemini should produce and which data it needs."></textarea></label>
   <label class="gem-field">Frequency<select class="fld" id="job-interval"><option value="5">Every 5 minutes</option><option value="15">Every 15 minutes</option><option value="30" selected>Every 30 minutes</option><option value="60">Every hour</option><option value="1440">Every day</option></select></label>
   <label class="row gem-hint"><input type="checkbox" id="job-enabled"> Enable after saving</label>
   <div class="row"><button class="btn" id="job-save">Save task</button><button class="btn g s" id="jobs-refresh">Refresh</button></div>
   <p class="gem-hint">Up to 10 tasks and 100 combined Gemini requests per rolling 24 hours. Your Google quota/billing applies. Fresh broker prices require the MT5 bridge to stay running.</p>
   <div id="gem-jobs"></div><h3 style="margin-top:16px">Results</h3><div id="gem-job-results"></div>
  </section>
  <section class="gem-tab" data-gempane="connections">
   <h3>API connections</h3><p class="gem-hint">API keys are encrypted in Supabase Vault. They are never added to the browser cache, exported backups or Gemini context.</p>
   <label class="gem-field">Provider<select class="fld" id="provider-name"><option value="gemini">Google Gemini</option><option value="massive">Massive / Polygon</option><option value="barchart">Barchart OnDemand</option><option value="finnhub">Finnhub calendar</option></select></label>
   <label class="gem-field">API key<input class="fld" id="provider-key" type="password" autocomplete="off" placeholder="Paste the provider API key"></label>
   <div class="row"><button class="btn g s" id="provider-show">Show key</button><button class="btn s" id="provider-save">Save key</button></div><p class="gem-hint" id="provider-status">Sign in to manage connections.</p>
   <label class="gem-field">Gemini model<input class="fld" id="gem-model" value="gemini-flash-lite-latest"></label><button class="btn g s" id="model-save">Save model</button>
   <p class="gem-hint">Crypto: public Binance spot feed, no key. Stocks/ETFs, equity options and forex/metals: Massive subscriptions. GC futures options: Barchart access. Oil/your broker gold price: MT5. Economic/earnings calendar: Finnhub plan. Market delay depends on your provider entitlement; source timestamps are shown.</p>
   <div class="row"><button class="btn g s" id="massive-connect">Connect Massive data</button><button class="btn g s" id="market-refresh">Refresh prices</button></div>
   <hr style="border:0;border-top:1px solid var(--ln);margin:18px 0"><h3>MT5 broker feed</h3><p class="gem-hint" id="broker-status">No broker feed connected.</p><div class="row"><button class="btn g s" id="bridge-create">Create / rotate token</button><a class="btn g s gem-download" href="./mt5_bridge.py" download>Download bridge</a></div><div class="gem-key" id="bridge-token"></div>
   <hr style="border:0;border-top:1px solid var(--ln);margin:18px 0"><h3>GC options</h3><label class="gem-field">Futures contract<input class="fld" id="gc-contract" value="GCZ26" maxlength="40"></label><button class="btn g s" id="gc-fetch">Fetch Barchart options</button>
   <p class="gem-hint">Alternative: import previous-session Volume/OI below. This is a liquidity filter, not intraday trade flow.</p>
   <div class="gem-split"><label class="gem-field">Session date<input class="fld" type="date" id="csv-session"></label><label class="gem-field">Option expiry<input class="fld" type="date" id="csv-expiry"></label></div>
   <label class="gem-field">CSV: type,strike,volume,oi<input class="fld" type="file" id="options-csv" accept=".csv,text/csv" style="height:auto;padding:8px"></label><button class="btn g s" id="csv-import">Import Volume/OI</button><p class="gem-hint" id="options-import-status"></p>
   <p class="gem-hint">Background photo: <a href="https://unsplash.com/photos/cGot2jFpKIM" target="_blank" rel="noopener noreferrer">Yashowardhan Singh / Unsplash</a>.</p>
  </section>
  <section class="gem-tab" data-gempane="account"><div id="gem-account"></div></section>
 </div><div class="gem-status" id="gem-status" role="status" aria-live="polite"></div>
</aside><div class="gem-banner" id="market-provenance">Connecting real market data…</div>`);

function notice(message, kind = '') { el('gem-status').textContent = message; el('gem-status').className = 'gem-status ' + kind; if (kind === 'error') toast(message); }
function openGemini(tab = 'chat') { restoreFocus = document.activeElement; el('gemini-panel').classList.add('open'); el('gemini-open').setAttribute('aria-expanded', 'true'); selectGemTab(tab); }
function closeGemini() { el('gemini-panel').classList.remove('open'); el('gemini-open').setAttribute('aria-expanded', 'false'); restoreFocus?.focus?.(); }
function selectGemTab(tab) { $$('[data-gemtab]').forEach(b => b.classList.toggle('on', b.dataset.gemtab === tab)); $$('[data-gempane]').forEach(b => b.classList.toggle('on', b.dataset.gempane === tab)); }
el('gemini-open').onclick = () => el('gemini-panel').classList.contains('open') ? closeGemini() : openGemini();
el('gemini-chart').onclick = () => openGemini();
el('gemini-code').onclick = () => { el('gem-mode').value = 'code'; openGemini(); el('gem-prompt').focus(); };
el('gemini-close').onclick = closeGemini;
el('gemini-tabs').onclick = e => { const b = e.target.closest('[data-gemtab]'); if (b) selectGemTab(b.dataset.gemtab); };
addEventListener('keydown', e => { if (e.key === 'Escape') closeGemini(); });
async function request(action, body = {}, old = false) {
  const session = AC ? (await AC.auth.getSession()).data.session : null;
  const h = { 'Content-Type': 'application/json', apikey: AVR.publishable };
  if (session) h.Authorization = 'Bearer ' + session.access_token;
  const res = await fetch(AVR.url + '/functions/v1/' + (old ? 'avenir-api' : 'avenir-workspace') + '?action=' + action, { method: 'POST', headers: h, body: JSON.stringify(body), signal: AbortSignal.timeout(action === 'chat' || action === 'job-run' ? 75000 : 30000) });
  const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Request failed.'); return data;
}
function bindAction(id, fn) { el(id).onclick = async () => { const button = el(id); if (button.disabled) return; button.disabled = true; button.setAttribute('aria-busy', 'true'); try { await fn(); } catch (e) { notice(e.message || 'Connection failed. Try again.', 'error'); } finally { button.disabled = false; button.removeAttribute('aria-busy'); } }; }
function requireAccount() { if (!AVR.session) { openGemini('account'); throw new Error('Sign in to use this feature.'); } }

function renderAccount() {
  const logged = AVR.session;
  el('acct').innerHTML = logged ? `<div class="row"><div class="av">${esc((AVR.profile?.display_name || 'A')[0])}</div><div style="flex:1"><b>${esc(AVR.profile?.display_name || 'Avenir member')}</b><div class="mut" style="font-size:12px">${esc(logged.user.email || '')}</div></div></div><button class="btn g s" id="drawer-account">Manage account</button>` : '<div class="gem-account-box"><div class="lbl">Account</div><button class="btn" id="drawer-account">Sign in / Create account</button><div class="mut" style="font-size:12px">Save your work securely with your Avenir account.</div></div>';
  el('drawer-account').onclick = () => { closeDrawer(); openGemini('account'); };
  el('gem-account').innerHTML = logged ? `<h3>Your account</h3><p class="gem-hint">${esc(logged.user.email || '')}</p><label class="gem-field">Display name<input class="fld" id="account-name" maxlength="60" value="${esc(AVR.profile?.display_name || 'Avenir member')}"></label><div class="row"><button class="btn s" id="account-save">Save name</button><button class="btn g s" id="account-out">Sign out</button></div><p class="gem-hint">Community posts show your display name. Scripts, watchlists, drawings, chats and tasks are private to your account.</p>` : `<h3>Welcome to Avenir</h3><form class="gem-auth" id="account-form" novalidate><label class="gem-field">Display name (for new accounts)<input class="fld" id="account-name" autocomplete="nickname" maxlength="60"></label><label class="gem-field">Email<input class="fld" id="account-email" type="email" autocomplete="username"></label><label class="gem-field">Password<input class="fld" id="account-password" type="password" autocomplete="current-password" minlength="8"></label><div class="row"><button class="btn" id="account-in" type="submit">Sign in</button><button class="btn g" type="button" id="account-up">Create account</button></div><button class="btn g s" style="margin-top:10px" type="button" id="account-reset">Forgot password</button><p class="gem-hint">New accounts may need email confirmation. Confirm your email, then return here to sign in.</p></form>`;
  if (logged) {
    bindAction('account-save', async () => { await request('profile', { name: el('account-name').value }); await refreshCloud(); notice('Display name saved.', 'success'); });
    bindAction('account-out', async () => { await syncWorkspace(); await AC.auth.signOut(); location.reload(); });
  } else {
    const authenticate = async signup => {
      if (!AC) throw new Error('Account service could not load. Reload the page.');
      const email = el('account-email').value.trim(), password = el('account-password').value;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) throw new Error('Enter a valid email and a password of at least 8 characters.');
      const name = el('account-name').value.trim();
      if (signup && !name) throw new Error('Enter your display name.');
      const result = signup ? await AC.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: location.origin + location.pathname } }) : await AC.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (el('account-password')) el('account-password').value = '';
      notice(result.data.session ? 'Signed in.' : 'Check your email to confirm your account, then return to sign in.', 'success');
    };
    el('account-form').onsubmit = async e => { e.preventDefault(); const b = el('account-in'); if (b.disabled) return; b.disabled = true; try { await authenticate(false); } catch (e) { notice(e.message, 'error'); } finally { if (el('account-in')) el('account-in').disabled = false; } };
    bindAction('account-up', () => authenticate(true));
    bindAction('account-reset', async () => { const email = el('account-email').value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter your account email first.'); const r = await AC.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); if (r.error) throw r.error; notice('If this email has an account, password-reset instructions will arrive.', 'success'); });
  }
}
renderAcct = renderAccount;

function renderConversations() { const selected = AVR.conversation || ''; el('gem-conversations').innerHTML = '<option value="">New conversation</option>' + (AVR.state?.conversations || []).map(c => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join(''); el('gem-conversations').value = selected; }
function renderMessages() {
  el('gem-messages').innerHTML = AVR.messages.length ? AVR.messages.map(m => `<article class="gem-message ${m.role === 'user' ? 'user' : ''}"><b>${m.role === 'user' ? 'You' : 'Gemini'}</b><div>${esc(m.content)}</div>${m.code ? `<details><summary>${esc(m.language || 'Code')} draft</summary><pre>${esc(m.code)}</pre></details><div class="row" style="margin-top:8px">${m.language === 'AvScript' ? `<button class="btn g s" data-code-insert="${m.id}">Insert in Terminal</button>` : ''}<button class="btn g s" data-code-copy="${m.id}">Copy code</button><button class="btn g s" data-code-download="${m.id}">Download</button></div>` : ''}</article>`).join('') : '<p class="gem-hint">Start a conversation. Gemini can use the current chart and Terminal code when you enable context.</p>';
  el('gem-messages').scrollTop = el('gem-messages').scrollHeight;
}
function chartContext() {
  if (!el('gem-context').checked) return { note: 'User disabled chart/editor context.' };
  const symbol = cur === 'term' ? T.sym : ST.sym, timeframe = cur === 'term' ? T.tf : ST.tf;
  return { symbol, timeframe, source: AVR.sources[symbol] || { status: 'not connected' }, as_of: new Date().toISOString(), bars: getBars(symbol, timeframe).slice(-100), editor: el('code').value.slice(0, 40000), avscript_reference: typeof HELP === 'string' ? HELP.slice(0, 22000) : '', examples: EXAMPLES.slice(0, 2), note: 'Chart volume may be broker tick volume. Missing fields are unavailable, not zero.' };
}
bindAction('gem-send', async () => {
  requireAccount(); const message = el('gem-prompt').value.trim(); if (!message) throw new Error('Write a message first.');
  AVR.chatBusy = true; AVR.chatDraft = message; notice('Gemini is responding…');
  try { const result = await request('chat', { id: AVR.conversation, message, context: chartContext(), mode: el('gem-mode').value, language: el('gem-language').value }); AVR.conversation = result.id; el('gem-prompt').value = ''; await loadMessages(); await refreshCloud(); notice('Response saved.', 'success'); }
  finally { AVR.chatBusy = false; }
});
async function loadMessages() { if (!AVR.conversation) { AVR.messages = []; renderMessages(); return; } AVR.messages = await request('messages', { id: AVR.conversation }); renderMessages(); }
bindAction('gem-refresh-chat', async () => { requireAccount(); await refreshCloud(); await loadMessages(); });
el('gem-new').onclick = () => { AVR.conversation = null; AVR.messages = []; renderConversations(); renderMessages(); };
el('gem-conversations').onchange = async () => { AVR.conversation = el('gem-conversations').value || null; try { await loadMessages(); } catch (e) { notice(e.message, 'error'); } };
function insertCode(message) { if (message.language !== 'AvScript') throw new Error('The built-in Terminal runs AvScript. Download this code for its own runtime.'); el('sNew').click(); el('sName').value = 'Gemini draft'; el('code').value = message.code; el('code').dispatchEvent(new Event('input', { bubbles: true })); el('sSave').click(); go('term'); notice('Draft inserted in Terminal. Review it, then use the existing Run button.', 'success'); }
el('gem-messages').onclick = async e => { const b = e.target.closest('button'); if (!b) return; const id = b.dataset.codeInsert || b.dataset.codeCopy || b.dataset.codeDownload; const m = AVR.messages.find(m => m.id === id); if (!m) return; try { if (b.dataset.codeInsert) insertCode(m); else if (b.dataset.codeCopy) { await navigator.clipboard.writeText(m.code); notice('Code copied.', 'success'); } else { const ext = { AvScript: 'avs', Python: 'py', MQL5: 'mq5', 'Pine Script': 'pine', JavaScript: 'js' }[m.language] || 'txt'; const url = URL.createObjectURL(new Blob([m.code], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = 'avenir-gemini.' + ext; a.click(); setTimeout(() => URL.revokeObjectURL(url), 5000); } } catch (e) { notice(e.message, 'error'); } };

function renderJobs() {
  el('gem-jobs').innerHTML = (AVR.state?.jobs || []).map(j => `<div class="gem-task"><b>${esc(j.title)}</b><p class="gem-hint">${j.enabled ? 'Enabled' : 'Paused'} · every ${j.interval_minutes} minutes · next ${new Date(j.next_run).toLocaleString()}</p><div class="row"><button class="btn g s" data-job-toggle="${j.id}" data-enabled="${!j.enabled}">${j.enabled ? 'Pause' : 'Enable'}</button><button class="btn g s" data-job-run="${j.id}">Run now</button></div></div>`).join('') || '<p class="gem-hint">No scheduled tasks yet.</p>';
  el('gem-job-results').innerHTML = (AVR.state?.runs || []).map(r => `<details class="gem-task"><summary>${esc(r.status.toUpperCase())} · ${new Date(r.created_at).toLocaleString()}</summary><pre>${esc(r.report || 'Running…')}</pre>${r.code ? `<pre>${esc(r.code)}</pre>` : ''}</details>`).join('') || '<p class="gem-hint">Task results will appear here.</p>';
}
bindAction('job-save', async () => { requireAccount(); await request('job-save', { title: el('job-title').value, instructions: el('job-instructions').value, interval_minutes: Number(el('job-interval').value), enabled: el('job-enabled').checked }); await refreshCloud(); notice('Task saved.', 'success'); });
bindAction('jobs-refresh', async () => { requireAccount(); await refreshCloud(); });
el('gem-jobs').onclick = async e => { const b = e.target.closest('button'); if (!b || b.disabled) return; b.disabled = true; try { if (b.dataset.jobToggle) await request('job-toggle', { id: b.dataset.jobToggle, enabled: b.dataset.enabled === 'true' }); else { notice('Running task…'); await request('job-run', { id: b.dataset.jobRun }); } await refreshCloud(); notice('Task updated.', 'success'); } catch (e) { notice(e.message, 'error'); } finally { b.disabled = false; } };
el('provider-show').onclick = () => { const field = el('provider-key'); field.type = field.type === 'password' ? 'text' : 'password'; el('provider-show').textContent = field.type === 'password' ? 'Show key' : 'Hide key'; };
bindAction('provider-save', async () => { requireAccount(); const provider = el('provider-name').value, key = el('provider-key').value.trim(); if (provider === 'gemini') await request('key', { key }, true); else await request('credential', { provider, key }); el('provider-key').value = ''; await refreshCloud(); notice('API key stored securely.', 'success'); });
bindAction('model-save', async () => { requireAccount(); await request('model', { model: el('gem-model').value.trim() }); notice('Gemini model saved.', 'success'); });
bindAction('bridge-create', async () => { requireAccount(); const result = await request('bridge-key', {}, true); el('bridge-token').textContent = 'Copy once; rotating invalidates the old token.\nAVENIR_BRIDGE_TOKEN=' + result.key + '\nAVENIR_URL=' + AVR.url + '\nFor all broker symbols: AVENIR_SYMBOLS=XAUUSD=XAUUSD,EURUSD=EURUSD,USOIL=your_broker_oil_symbol'; notice('Bridge token created.', 'success'); });

function applyBroker(market) {
  for (const [key, bars] of Object.entries(market?.payload?.bars || {})) { BARS[key] = bars; }
  for (const [symbol, quote] of Object.entries(market?.payload?.quotes || {})) {
    if (!U[symbol]) { U[symbol] = { s: symbol, n: symbol + ' · MT5', t: 'forex', b: quote.bid }; UNI.push([symbol, symbol + ' · MT5', 'forex', quote.bid]); SYMS.push(symbol); }
    LIVE[symbol] = (quote.bid + quote.ask) / 2; OPEN[symbol] = quote.previous_close || NaN;
    AVR.sources[symbol] = { source: 'MT5 broker', timestamp: quote.time, volume_kind: 'broker tick volume' };
  }
  const quotes = Object.keys(market?.payload?.quotes || {});
  el('broker-status').textContent = quotes.length ? 'Receiving ' + quotes.join(', ') + ' · last upload ' + new Date(market.received_at).toLocaleString() : 'No broker feed connected.';
}
async function refreshCloud(initial = false) {
  if (!AVR.session) return;
  const state = await request('bootstrap'); AVR.state = state; AVR.profile = state.profile;
  if (initial) {
    window.AV_WORKSPACE_KEY = 'avenir_user_' + AVR.session.user.id;
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(window.AV_WORKSPACE_KEY) || 'null'); } catch {}
    WORK_KEYS.forEach(k => { if (cached?.[k] !== undefined) ST[k] = cached[k]; else if (DEF[k] !== undefined) ST[k] = JSON.parse(JSON.stringify(DEF[k])); });
    T.sid = null;
    AVR.revision = state.workspace?.revision || null;
    if (state.workspace?.payload) { WORK_KEYS.forEach(k => { if (state.workspace.payload[k] !== undefined) ST[k] = state.workspace.payload[k]; }); save(); setTheme(ST.theme); renderWL(); renderMk(); }
    AVR.cloudReady = true;
    el('gem-model').value = state.model;
  }
  ST.user = { name: state.profile?.display_name || 'Avenir member', email: AVR.session.user.email };
  if (initial || !el('account-save') || el('account-name')?.value === AVR.profile?.display_name) renderAccount();
  renderConversations(); renderJobs(); applyBroker(state.market);
  el('provider-status').textContent = 'Saved: ' + ([state.gemini_saved ? 'Gemini' : '', ...(state.providers || [])].filter(Boolean).join(', ') || 'none');
  if (state.options) el('options-import-status').textContent = state.options.contract + ' · previous session ' + state.options.session_date + ' · ' + state.options.rows.length + ' rows';
  if (initial && state.providers.includes('massive')) connectMassive().catch(e => notice(e.message, 'error'));
  if (chart && cur === 'charts') chart.setSymbol(ST.sym, ST.tf, chart.N > 0);
}
async function syncWorkspace() {
  if (!AVR.session || !AVR.cloudReady || AVR.syncing) return;
  AVR.syncing = true;
  try { const payload = {}; WORK_KEYS.forEach(k => payload[k] = ST[k]); const saved = await request('workspace', { payload, revision: AVR.revision }); AVR.revision = saved.revision; }
  catch (e) { notice('Cloud sync failed. Local work retained. ' + e.message, 'error'); }
  finally { AVR.syncing = false; }
}
function queueSync() { clearTimeout(syncTimer); syncTimer = setTimeout(syncWorkspace, 1500); }
document.addEventListener('click', e => { if (!e.target.closest('#gemini-panel')) queueSync(); });
document.addEventListener('change', e => { if (!e.target.closest('#gemini-panel')) queueSync(); });
document.addEventListener('pointerup', e => { if (e.target.id === 'cv') queueSync(); });
el('code').addEventListener('input', queueSync);

// Real market adapters. The original synthetic generators are disabled.
async function publicCryptoQuotes() {
  const result = await request('crypto', { op: 'quotes' });
  result.data.forEach(row => { if (!U[row.symbol]) return; LIVE[row.symbol] = Number(row.lastPrice); OPEN[row.symbol] = Number(row.openPrice); AVR.sources[row.symbol] = { source: result.source, timestamp: new Date(row.closeTime).toISOString(), volume_kind: 'exchange base volume' }; });
  if (!LV.on) { LV.status = 'Real Binance crypto · connect APIs for other markets'; updateDsrc(); }
  if (cur === 'home') { renderWL(); renderMk(); }
}
window.AV_REQUEST_BARS = async (symbol, tf) => {
  const key = symbol + '|' + tf, last = AVR.requests.get(key) || 0;
  if ((AVR.pendingBars >= 3 && symbol !== ST.sym) || Date.now() - last < 60000 || !U[symbol]) return;
  AVR.requests.set(key, Date.now()); AVR.pendingBars++;
  try {
    if (U[symbol].t === 'crypto') {
      const result = await request('crypto', { op: 'bars', symbol, interval: tf === '1D' ? '1d' : tf === '1W' ? '1w' : tf });
      BARS[key] = result.data.map(r => ({ t: Math.floor(r[0] / 1000), o: Number(r[1]), h: Number(r[2]), l: Number(r[3]), c: Number(r[4]), v: Number(r[5]) }));
    } else if (LV.on && pgTicker(symbol)) await lvBars(symbol, tf);
    if (chart?.sym === symbol && chart.tf === tf) chart.setSymbol(symbol, tf, chart.N > 0);
    if (prev?.sym === symbol && prev.tf === tf) prev.setSymbol(symbol, tf, prev.N > 0);
    if (cur === 'home') renderWL();
  } catch (e) { el('apiSt').textContent = e.message; }
  finally { AVR.pendingBars--; }
};
const originalTicker = pgTicker;
pgTicker = function(symbol) { if (U[symbol]?.t === 'crypto' || AVR.state?.market?.payload?.quotes?.[symbol]) return null; return originalTicker(symbol); };
const oldLvGet = lvGet;
lvGet = async function(path) {
  if (LV.base !== 'cloud://massive') return oldLvGet(path);
  const data = await request('data', { path });
  if (Array.isArray(data.tickers)) data.tickers.forEach(row => {
    const symbol = row.ticker.replace(/^C:/, '').replace(/^X:/, '').replace(/USD$/, row.ticker.startsWith('X:') ? 'USDT' : 'USD');
    let t = row.lastTrade?.t || row.lastQuote?.t || row.updated || row.day?.t;
    if (t > 1e17) t /= 1e6; else if (t > 1e14) t /= 1e3; else if (t < 1e11) t *= 1000;
    AVR.sources[symbol] = { source: 'Massive / Polygon', timestamp: Number.isFinite(t) ? new Date(t).toISOString() : null, note: 'Delay depends on subscription.' };
  });
  return data;
};
async function connectMassive() { requireAccount(); LV.base = 'cloud://massive'; await lvGet('/v2/aggs/ticker/AAPL/prev'); LV.on = true; LV.status = 'Massive connected · delay depends on plan'; LV.poll = (ST.poll || 15) * 1000; await lvPoll(); lvLoop(); updateDsrc(); notice('Massive connected. Unentitled datasets remain unavailable.', 'success'); }
bindAction('massive-connect', connectMassive);
bindAction('market-refresh', async () => { await publicCryptoQuotes(); if (LV.on) await lvPoll(); if (AVR.session) await refreshCloud(); notice('Market sources refreshed.', 'success'); });
window.AV_CLOCK = () => { const s = AVR.sources[ST.sym]; if (!s) return 'UTC ' + new Date().toISOString().slice(11, 19) + ' · connect data'; const age = s.timestamp ? (Date.now() - Date.parse(s.timestamp)) / 1000 : Infinity; return s.source + ' · ' + (age < 120 ? 'LIVE' : 'last available') + (s.timestamp ? ' ' + new Date(s.timestamp).toLocaleTimeString() : ' · timestamp unavailable'); };
function provenance() { const s = AVR.sources[ST.sym]; el('market-provenance').textContent = s ? window.AV_CLOCK() : 'Real data · crypto connected when available · other markets need API access'; $$('[data-ch],[data-mch],[data-cc]').forEach(n => { const symbol = n.dataset.ch || n.dataset.mch || n.dataset.cc; if (!Number.isFinite(LIVE[symbol]) || !Number.isFinite(OPEN[symbol])) n.textContent = '—'; }); }
const originalUpdateHome = updateHome; updateHome = function() { originalUpdateHome(); provenance(); };
const originalWL = renderWL; renderWL = function() { originalWL(); provenance(); };

// Preserve the original options table and analytics. Missing provider fields
// remain NaN internally and are displayed as unavailable, never simulated.
mapChain = function(symbol, dte, results) {
  let spot = LIVE[symbol]; const rows = new Map();
  const missing = (type, strike) => ({ type, strike, dte, iv: NaN, price: NaN, delta: NaN, gamma: NaN, theta: NaN, vega: NaN, rho: NaN, oi: NaN, volume: NaN, bid: NaN, ask: NaN, last: NaN });
  for (const r of results) {
    if (r.underlying_asset?.price > 0) spot = r.underlying_asset.price;
    const strike = r.details?.strike_price, type = r.details?.contract_type === 'call' ? 'C' : 'P'; if (!(strike > 0)) continue;
    const g = r.greeks || {}, quote = r.last_quote || {};
    const value = { ...missing(type, strike), iv: r.implied_volatility ?? NaN, delta: g.delta ?? NaN, gamma: g.gamma ?? NaN, theta: g.theta ?? NaN, vega: g.vega ?? NaN, oi: r.open_interest ?? NaN, volume: r.day?.volume ?? NaN, bid: quote.bid ?? NaN, ask: quote.ask ?? NaN, last: r.last_trade?.price ?? r.day?.close ?? NaN };
    value.price = value.last;
    const row = rows.get(strike) || { K: strike, c: missing('C', strike), p: missing('P', strike) }; row[type === 'C' ? 'c' : 'p'] = value; rows.set(strike, row);
  }
  const sorted = [...rows.values()].sort((a, b) => a.K - b.K); let step = Infinity; for (let i = 1; i < sorted.length; i++) step = Math.min(step, sorted[i].K - sorted[i - 1].K);
  return { S: spot, rows: sorted, step: Number.isFinite(step) ? step : 1, atm: sorted.length ? sorted.reduce((a, b) => Math.abs(a.K - spot) < Math.abs(b.K - spot) ? a : b).K : spot, T: Math.max(dte, .5) / 365, dte };
};
window.AV_CHAIN = (symbol, dte) => { if (AVR.futures[symbol]) return AVR.futures[symbol]; return liveChain(symbol, dte) || emptyChain(symbol, dte, { error: 'provider not connected' }); };
const originalRenderOptions = renderOptions;
renderOptions = function() { originalRenderOptions(); const walker = document.createTreeWalker(el('p-options'), NodeFilter.SHOW_TEXT); let n; while ((n = walker.nextNode())) if (/NaN|Infinity/.test(n.textContent)) n.textContent = n.textContent.replace(/[-+]?NaN%?|[-+]?Infinity%?/g, '—'); };
onShow.options = () => { el('odte').value = EXP[OP.exp].dte; el('odtev').textContent = EXP[OP.exp].dte; requestAnimationFrame(renderOptions); };
bindAction('gc-fetch', async () => {
  requireAccount(); const contract = el('gc-contract').value.trim().toUpperCase(); const result = await request('barchart', { contract });
  const all = result.results || []; if (!all.length) throw new Error('No Barchart option contracts returned.');
  if (result.underlying_quote?.lastPrice > 0) LIVE[contract] = result.underlying_quote.lastPrice;
  if (!Number.isFinite(LIVE[contract])) throw new Error('Barchart returned options but no underlying futures quote. Check quote access on your plan before displaying strike-based analytics.');
  const rows = all.map(r => ({ details: { strike_price: Number(r.strike), contract_type: String(r.type).toLowerCase().startsWith('c') ? 'call' : 'put' }, greeks: { delta: r.delta, gamma: r.gamma, theta: r.theta, vega: r.vega }, implied_volatility: r.impliedVolatility, open_interest: r.openInterest, day: { volume: r.volume, close: r.last } }));
  const expiration = [...new Set(all.map(r => r.expirationDate?.slice(0, 10)).filter(Boolean))].sort();
  const first = expiration[0], selected = first ? all.filter(r => r.expirationDate?.startsWith(first)) : all;
  const mapped = selected.map(r => rows[all.indexOf(r)]); AVR.futures[contract] = mapChain(contract, first ? Math.max(0, Math.ceil((Date.parse(first + 'T23:59:59Z') - Date.now()) / 86400000)) : 0, mapped);
  if (!U[contract]) { U[contract] = { s: contract, n: 'Gold futures options · Barchart', t: 'future', b: 0 }; el('osym').insertAdjacentHTML('beforeend', '<option>' + esc(contract) + '</option>'); }
  if (first) { EXP.splice(0, EXP.length, { d: new Date(first + 'T12:00:00Z'), dte: AVR.futures[contract].dte, monthly: false, label: first + ' · Barchart expiry' }); OP.exp = 0; el('oexp').innerHTML = '<option value="0">' + esc(first) + '</option>'; }
  ST.osym = contract; renderOptions(); notice('Barchart options loaded. Missing fields remain unavailable.', 'success');
});
const originalOptionSymbolChange = el('osym').onchange;
el('osym').onchange = function(event) {
  if (!AVR.futures[this.value] && EXP.length !== originalExpiries.length) {
    EXP.splice(0, EXP.length, ...originalExpiries); OP.exp = Math.min(OP.exp, EXP.length - 1);
    el('oexp').innerHTML = EXP.map((e, i) => `<option value="${i}">${esc(e.label)}</option>`).join('');
  }
  originalOptionSymbolChange?.call(this, event);
};
function parseOptionsCSV(text) { const lines = text.trim().split(/\r?\n/).map(l => l.split(',').map(x => x.trim())); const head = lines.shift()?.map(x => x.toLowerCase()); if (!head || !['type', 'strike', 'volume', 'oi'].every(k => head.includes(k))) throw new Error('CSV headers must include type,strike,volume,oi.'); return lines.filter(l => l.some(Boolean)).map(l => ({ type: l[head.indexOf('type')].toUpperCase().slice(0, 1), strike: Number(l[head.indexOf('strike')]), volume: Number(l[head.indexOf('volume')]), oi: Number(l[head.indexOf('oi')]) })); }
bindAction('csv-import', async () => { requireAccount(); const file = el('options-csv').files[0]; if (!file || file.size > 1000000) throw new Error('Choose a CSV under 1 MB.'); await request('options', { contract: el('gc-contract').value.trim(), session_date: el('csv-session').value, expiry: el('csv-expiry').value, rows: parseOptionsCSV(await file.text()) }, true); await refreshCloud(); notice('Previous-session Volume/OI saved for research tasks.', 'success'); });

// Retain the original Community UI, backed by real accounts, posts, likes and comments.
const oldFeed = el('feed'), realFeed = oldFeed.cloneNode(false); oldFeed.replaceWith(realFeed);
async function loadCommunity() { const posts = await request('community'); ST.posts = posts; renderRealCommunity(); }
function renderRealCommunity() {
  realFeed.innerHTML = (ST.posts || []).map(p => `<article class="post glass" data-pid="${p.id}"><div class="row" style="margin-bottom:8px"><div class="av">${esc(p.u[0] || 'A')}</div><div style="flex:1"><b>${esc(p.u)}</b><div class="mut" style="font-size:12px">${ago(p.t)}</div></div><button class="tag glass" data-chart="${esc(p.sym)}">${esc(p.sym)}</button><span class="tag ${p.dir === 'Bullish' ? 'up' : p.dir === 'Bearish' ? 'dn' : ''}">${esc(p.dir)}</span></div><h3 style="font-size:18px;margin-bottom:6px">${esc(p.title)}</h3><p style="margin:0 0 10px;white-space:pre-wrap">${esc(p.body)}</p><div class="row"><button class="btn g s" data-like="${p.id}">${p.liked ? '♥' : '♡'} ${p.likes}</button><button class="btn g s" data-cm="${p.id}">💬 ${p.c.length}</button>${p.own ? `<button class="btn g s" data-delp="${p.id}">Delete</button>` : ''}</div><div id="cm${p.id}" style="display:none;margin-top:10px">${p.c.map(c => `<div style="padding:6px 0;border-top:1px solid var(--ln)"><b>${esc(c.u)}</b><div>${esc(c.txt)}</div></div>`).join('')}<input class="fld" placeholder="Write a comment and press Enter" data-cin="${p.id}"></div></article>`).join('') || '<div class="glass post gem-feed-empty">No community ideas yet. Sign in to share the first one.</div>';
}
renderPosts = renderRealCommunity;
realFeed.onclick = async e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.chart) return openSym(b.dataset.chart); if (b.dataset.cm) { const c = el('cm' + b.dataset.cm); c.style.display = c.style.display === 'none' ? 'block' : 'none'; return; } try { requireAccount(); const id = b.dataset.like || b.dataset.delp; if (b.dataset.like) await request('like', { id, liked: !ST.posts.find(p => p.id === id).liked }); else await request('post-delete', { id }); await loadCommunity(); } catch (e) { notice(e.message, 'error'); } };
realFeed.onkeydown = async e => { if (e.key !== 'Enter' || !e.target.dataset.cin || e.isComposing) return; try { requireAccount(); const id = e.target.dataset.cin; await request('comment', { id, body: e.target.value }); await loadCommunity(); el('cm' + id).style.display = 'block'; } catch (e) { notice(e.message, 'error'); } };
el('cPost').onclick = async () => { try { requireAccount(); await request('post', { symbol: el('cSym').value, direction: CDIR, title: el('cTitle').value, body: el('cBody').value }); el('cTitle').value = ''; el('cBody').value = ''; await loadCommunity(); toast('Idea posted'); } catch (e) { notice(e.message, 'error'); } };
onShow.community = () => { el('cSym').value = ST.sym; loadCommunity().catch(e => { realFeed.innerHTML = '<div class="glass post">Community unavailable. ' + esc(e.message) + '</div>'; }); };

const originalMonthEvents = monthEvents;
monthEvents = function(y, m) { const events = originalMonthEvents(y, m); for (const [key, values] of Object.entries(AVR.calendar)) if (key.startsWith(y + '-' + (m + 1) + '-')) events[key] = [...(events[key] || []), ...values.filter(e => CAL.f[e.k])]; return events; };
async function loadCalendar() {
  if (!AVR.session || !AVR.state?.providers.includes('finnhub')) return;
  const from = iso(new Date(CAL.y, CAL.m, 1)), to = iso(new Date(CAL.y, CAL.m + 1, 0)); const result = await request('calendar', { from, to });
  AVR.calendar = {}; const add = (date, k, title) => { const d = new Date(date); if (!Number.isFinite(+d)) return; const key = dk(d); (AVR.calendar[key] ||= []).push({ k, t: title }); };
  result.earnings.forEach(r => add(r.date + 'T12:00:00', 'e', r.symbol + ' earnings')); result.economic.forEach(r => add(r.time, 'm', r.event));
  renderCal(); if (result.errors.length) toast('Some calendar data is unavailable on your provider plan.');
}
onShow.calendar = () => { renderCal(); loadCalendar().catch(e => toast(e.message)); };
['cPrev', 'cNext', 'cToday'].forEach(id => el(id).addEventListener('click', () => loadCalendar().catch(e => toast(e.message))));

function scalePrice(factor) { if (!chart.L || !chart.N) return; const lo = chart.log ? Math.log(chart.L.mn) : chart.L.mn, hi = chart.log ? Math.log(chart.L.mx) : chart.L.mx, center = (hi + lo) / 2, span = (hi - lo) * factor; chart.manualScale = { lo: center - span / 2, hi: center + span / 2 }; chart.dirty = 1; }
el('scale-reset').onclick = () => { chart.manualScale = null; chart.dirty = 1; };
el('scale-plus').onclick = () => scalePrice(.8); el('scale-minus').onclick = () => scalePrice(1.25);
el('logBtn').addEventListener('click', () => { chart.manualScale = null; chart.dirty = 1; });
const originalRunCode = runCode;
runCode = async function() { if (!getBars(T.sym, T.tf).length) { cons.textContent = 'No real history loaded for this symbol/timeframe. Connect a provider or select a connected crypto pair.'; return; } return originalRunCode(); };
el('sRun').onclick = runCode;
const customConnect = lvConnect;
el('apiGo').onclick = async () => { try { const value = el('apiUrl').value.trim(); if (!value || value === 'cloud://massive') await connectMassive(); else { const ok = await customConnect(value); if (!ok) throw new Error(LV.status); } } catch (e) { toast(e.message); } };
el('apiOff').textContent = 'Disconnect feed'; el('apiOff').onclick = () => { LV.on = false; clearTimeout(LV.timer); LV.status = 'Provider disconnected; public crypto remains available.'; updateDsrc(); };
el('apiSt').textContent = 'Public crypto connects automatically. Configure other providers in Gemini → Connections.';

async function bootAvenir() {
  renderAccount();
  publicCryptoQuotes().catch(e => { el('apiSt').textContent = 'Public crypto feed unavailable: ' + e.message; });
  if (!AC) { notice('Account service failed to load. Reload the page.', 'error'); return; }
  const result = await AC.auth.getSession(); AVR.session = result.data.session;
  if (AVR.session) await refreshCloud(true); else { ST.user = null; renderAccount(); }
  AC.auth.onAuthStateChange((event, session) => {
    AVR.session = session;
    if (event === 'PASSWORD_RECOVERY') { openGemini('account'); el('gem-account').innerHTML = '<h3>Set a new password</h3><label class="gem-field">New password<input class="fld" type="password" autocomplete="new-password" id="recovery-password"></label><button class="btn" id="recovery-save">Save password</button>'; bindAction('recovery-save', async () => { const password = el('recovery-password').value; if (password.length < 8) throw new Error('Use at least 8 characters.'); const r = await AC.auth.updateUser({ password }); if (r.error) throw r.error; el('recovery-password').value = ''; renderAccount(); notice('Password updated.', 'success'); }); return; }
    if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;
    if (session) setTimeout(() => refreshCloud(true).catch(e => notice(e.message, 'error')), 0);
    else {
      AVR.state = null; AVR.profile = null; AVR.messages = []; AVR.conversation = null; AVR.cloudReady = false;
      window.AV_WORKSPACE_KEY = 'avenir_guest';
      let guest = null; try { guest = JSON.parse(localStorage.getItem(window.AV_WORKSPACE_KEY) || 'null'); } catch {}
      WORK_KEYS.forEach(k => { if (guest?.[k] !== undefined) ST[k] = guest[k]; else if (DEF[k] !== undefined) ST[k] = JSON.parse(JSON.stringify(DEF[k])); });
      ST.user = null; ST.posts = []; T.sid = null; T.res = null;
      LV.on = false; clearTimeout(LV.timer);
      Object.keys(BARS).forEach(k => { if (U[k.split('|')[0]]?.t !== 'crypto') delete BARS[k]; });
      Object.keys(LIVE).forEach(s => { if (U[s]?.t !== 'crypto') { LIVE[s] = NaN; OPEN[s] = NaN; delete AVR.sources[s]; } });
      ['gem-prompt', 'provider-key', 'job-title', 'job-instructions', 'cTitle', 'cBody'].forEach(id => el(id).value = '');
      el('bridge-token').textContent = ''; chart.setScript(null); prev.setScript(null);
      renderAccount(); renderMessages(); renderJobs(); onShow[cur]?.();
    }
  });
}
bootAvenir().catch(e => notice(e.message, 'error'));
setInterval(() => { if (!document.hidden) { publicCryptoQuotes().catch(() => {}); if (AVR.session) refreshCloud().catch(e => notice(e.message, 'error')); if (cur === 'charts') { const key = ST.sym + '|' + ST.tf; AVR.requests.delete(key); window.AV_REQUEST_BARS(ST.sym, ST.tf); } } provenance(); }, 30000);
addEventListener('offline', () => notice('Offline. Local work is retained; Supabase tasks continue.', 'error'));
addEventListener('online', () => { if (AVR.session) refreshCloud().catch(e => notice(e.message, 'error')); });
const originalMarketChips = renderMk;
renderMk = function() { originalMarketChips(); provenance(); };

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
  const promise=alphaRequest(body).then(r=>{ alphaIngest(r); if(Number.isFinite(r.remaining)) ALPHA.used=25-r.remaining; alphaStatus(); return r; }).finally(()=>ALPHA.pending.delete(key));
  ALPHA.pending.set(key,promise); return promise;
}
function alphaStatus(message='') { el('alpha-status').textContent = message || 'Connected securely · '+ALPHA.used+'/25 daily requests reserved · cached datasets are reused. Daily data is not live.'; }
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
