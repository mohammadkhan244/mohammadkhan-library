{
const D = JSON.parse(document.getElementById('train-data').textContent);
const { stories, towns, questions } = D;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtWc = wc => wc ? wc.toLocaleString() + ' words' + (wc >= 100 ? ' · ~' + Math.round(wc/238) + ' min' : '') : '';

// ── theme toggle ──
(function() {
  const btn = $('train-theme'), sun = $('t-sun'), moon = $('t-moon');
  if (!btn) return;
  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch(e) {}
    sun.style.display  = t === 'dark' ? '' : 'none';
    moon.style.display = t === 'dark' ? 'none' : '';
    btn.setAttribute('aria-label', t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  const cur = document.documentElement.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
  apply(cur);
  btn.addEventListener('click', () => apply(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'));
})();

// ── state ──
let route = [];       // town IDs visited in order
let curTown = '';     // current town ID
let curStory = null;  // current story object
let carriage = [];    // picked-up stories (max 3)

// ── helpers ──
const townById = id => towns.find(t => t.id === id);
const storiesInTown = id => stories.filter(s => s.towns.includes(id));
const storiesInBothTowns = (a, b) => stories.filter(s => s.towns.includes(a) && s.towns.includes(b));
const questionKey = (a, b) => [a, b].sort().join('|');
const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

// ── route planning ──
function getAdjacentTowns() {
  // Towns reachable from current via shared stories
  return towns.map(t => t.id).filter(tid => tid !== curTown && storiesInBothTowns(curTown, tid).length > 0);
}

function getAutoNextTown() {
  const adj = getAdjacentTowns();
  if (!adj.length) return pickRandom(towns.filter(t => t.id !== curTown)).id;
  const unvisited = adj.filter(tid => !route.includes(tid));
  return pickRandom(unvisited.length ? unvisited : adj);
}

function getChangeLineOptions(n) {
  // n alternative towns (not the auto-next one, not current)
  const adj = getAdjacentTowns();
  const pool = adj.length >= n + 1 ? adj : [...new Set([...adj, ...towns.map(t => t.id).filter(tid => tid !== curTown)])];
  const autoNext = getAutoNextTown();
  const opts = pool.filter(tid => tid !== autoNext).slice(0, n);
  return opts.map(tid => townById(tid)).filter(Boolean);
}

// ── split-flap departures board ──
const FLAP = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:.,\'!?';
const DEST_LEN = 18;
const LINE_LEN = 10;

let boardRows = [];
let flipTimeout = null;

function truncDest(t) {
  const u = t.toUpperCase();
  return u.length > DEST_LEN ? u.slice(0, DEST_LEN - 3) + '...' : u;
}

function makeFlapChars(text, maxLen) {
  const str = String(text).toUpperCase();
  const padded = str.length > maxLen ? str.slice(0, maxLen) : str.padEnd(maxLen, ' ');
  return [...padded].map(c => `<span class="flap-ch">${esc(c)}</span>`).join('');
}

function animateFlapEl(el, text, maxLen, reduced) {
  if (!el) return;
  const str = String(text).toUpperCase();
  const target = str.length > maxLen ? str.slice(0, maxLen) : str.padEnd(maxLen, ' ');
  const spans = el.querySelectorAll('.flap-ch');
  spans.forEach((sp, i) => {
    const ch = target[i] || ' ';
    if (reduced) { sp.textContent = ch; return; }
    const ms = 350 + Math.random() * 250; // 350–600ms
    const frames = Math.round(ms / 50);
    let f = 0;
    const iv = setInterval(() => {
      if (f++ < frames) sp.textContent = FLAP[Math.floor(Math.random() * FLAP.length)];
      else { sp.textContent = ch; clearInterval(iv); }
    }, 50);
  });
}

function statusForRow(story, rowIdx) {
  if (rowIdx === 0) return { cls: 'dr-status--boarding', text: 'BOARDING' };
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 14);
  if (story.d >= cutoff.toISOString().slice(0, 10)) return { cls: 'dr-status--new', text: 'NEW' };
  return { cls: '', text: 'ON TIME' };
}

function fakeTime(offsetMins) {
  return new Date(Date.now() + offsetMins * 60000)
    .toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'America/Chicago',
    });
}

function buildBoard() {
  const board = $('depart-rows'); if (!board) return;
  if (flipTimeout) { clearTimeout(flipTimeout); flipTimeout = null; }

  // 2 newest + 4 random from distinct towns
  const sorted = [...stories].sort((a, b) => b.d.localeCompare(a.d));
  const newest = sorted.slice(0, 2);
  const usedIds = new Set(newest.map(s => s.id));
  const usedTowns = new Set(newest.flatMap(s => s.towns));
  const pool4 = [];

  for (const t of towns) {
    if (pool4.length >= 4) break;
    if (usedTowns.has(t.id)) continue;
    const cands = stories.filter(s => !usedIds.has(s.id) && s.towns.includes(t.id));
    if (!cands.length) continue;
    const pick = pickRandom(cands);
    pool4.push(pick);
    usedIds.add(pick.id);
    pick.towns.forEach(tid => usedTowns.add(tid));
  }
  while (pool4.length < 4) {
    const rem = stories.filter(s => !usedIds.has(s.id));
    if (!rem.length) break;
    const pick = pickRandom(rem);
    pool4.push(pick);
    usedIds.add(pick.id);
  }

  boardRows = [...newest, ...pool4].slice(0, 6);

  board.innerHTML = boardRows.map((s, i) => {
    const st = statusForRow(s, i);
    return `<button class="depart-row" aria-label="${esc('Board: ' + s.t)}">` +
      `<span class="dr-time">${fakeTime(5 + i * 7)}</span>` +
      `<span class="dr-dest">${makeFlapChars(truncDest(s.t), DEST_LEN)}</span>` +
      `<span class="dr-line">${makeFlapChars((townById(s.towns[0])?.name || '').toUpperCase(), LINE_LEN)}</span>` +
      `<span class="dr-status${st.cls ? ' ' + st.cls : ''}">${st.text}</span>` +
      `<span class="dr-board">BOARD →</span>` +
    `</button>`;
  }).join('');

  board.querySelectorAll('.depart-row').forEach((row, i) => {
    row.onclick = () => board_(boardRows[i]);
  });

  startFlipLoop();
}

function startFlipLoop() {
  if (flipTimeout) clearTimeout(flipTimeout);
  let idx = 0;
  function next() {
    flipTimeout = setTimeout(() => {
      const board = $('depart-rows'); if (!board) return;
      const rows = board.querySelectorAll('.depart-row');
      if (!rows.length) return;

      const ri = idx % rows.length;
      const story = pickRandom(stories);
      boardRows[ri] = story;

      const row = rows[ri];
      row.setAttribute('aria-label', 'Board: ' + story.t);
      row.onclick = () => board_(story);

      const st = statusForRow(story, ri);
      const statusEl = row.querySelector('.dr-status');
      if (statusEl) {
        statusEl.className = 'dr-status' + (st.cls ? ' ' + st.cls : '');
        statusEl.textContent = st.text;
      }

      const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
      animateFlapEl(row.querySelector('.dr-dest'), truncDest(story.t), DEST_LEN, reduced);
      animateFlapEl(row.querySelector('.dr-line'), (townById(story.towns[0])?.name || '').toUpperCase(), LINE_LEN, reduced);

      idx++;
      next();
    }, 7000 + Math.random() * 2000);
  }
  next();
}

// ── live clock (America/Chicago) ──
function startClock() {
  const el = $('depart-clock'); if (!el) return;
  function tick() {
    el.textContent = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: 'America/Chicago',
    }).format(new Date());
  }
  tick();
  const msToNextMinute = 60000 - (Date.now() % 60000);
  setTimeout(() => { tick(); setInterval(tick, 60000); }, msToNextMinute);
}

// ── boarding ──
function board_(story) {
  if (!story) return;
  curStory = story;
  curTown = story.towns[0];
  route = [curTown];
  carriage = [];
  showRide();
  renderAll();
  if (flipTimeout) { clearTimeout(flipTimeout); flipTimeout = null; }
}

function boardTown(townId) {
  const ss = storiesInTown(townId);
  if (!ss.length) return;
  board_(pickRandom(ss));
}

$('board-random').onclick = () => boardTown(pickRandom(towns).id);

// ── show/hide lobby/ride ──
function showLobby() {
  $('train-lobby').hidden = false;
  $('train-ride').hidden = true;
  buildBoard();
  startClock();
}

function showRide() {
  $('train-lobby').hidden = true;
  $('train-ride').hidden = false;
}


// ── town accent colour ──
function townColor(id) {
  return ({ 'sci-fi':'#064f6e','realism':'#ae5224','philosophy':'#4f4086','horror':'#a62c37','making':'#635a3a','fable':'#71502f' })[id] || 'var(--accent)';
}

// ── route strip — visited + ghost upcoming ──
function renderRoute() {
  const bar = $('route-bar');
  const lbl = $('route-label');
  if (!bar) return;
  if (lbl) lbl.textContent = `Your route · ${route.length} ${route.length === 1 ? 'stop' : 'stops'}`;

  const adj = getAdjacentTowns().filter(tid => !route.includes(tid)).slice(0, 3);
  const parts = [];

  route.forEach((tid, i) => {
    const isCur = i === route.length - 1;
    const t = townById(tid);
    const name = esc(t?.name || tid);
    if (i > 0) parts.push('<span class="rd-track" aria-hidden="true"></span>');
    parts.push(
      `<div class="rd-seg ${isCur ? 'rd-cur' : 'rd-past'}" data-town="${esc(tid)}">` +
        `<button class="rd-dot" aria-label="${isCur ? 'Current stop: ' + name : 'Back to ' + name}" ${isCur ? 'disabled' : ''}></button>` +
        `<span class="rd-name">${name}</span>` +
      `</div>`
    );
  });

  adj.forEach(tid => {
    const t = townById(tid);
    const name = esc(t?.name || tid);
    parts.push('<span class="rd-track rd-future" aria-hidden="true"></span>');
    parts.push(
      `<div class="rd-seg rd-future" data-town="${esc(tid)}">` +
        `<button class="rd-dot" aria-label="Go to ${name}"></button>` +
        `<span class="rd-name">${name}</span>` +
      `</div>`
    );
  });

  bar.innerHTML = parts.join('');

  bar.querySelectorAll('.rd-past button').forEach(btn => {
    btn.onclick = () => {
      const tid = btn.closest('[data-town]').dataset.town;
      const idx = route.indexOf(tid);
      if (idx < 0) return;
      route = route.slice(0, idx + 1);
      curTown = tid;
      const ss = storiesInTown(tid);
      if (ss.length) curStory = pickRandom(ss);
      renderAll();
    };
  });

  bar.querySelectorAll('.rd-future button').forEach(btn => {
    btn.onclick = () => moveToTown(btn.closest('[data-town]').dataset.town);
  });
}

// ── current stop card — always dark ──
function renderStop() {
  const el = $('current-stop'); if (!el || !curStory) return;
  const s = curStory;
  const inCarriage = carriage.some(c => c.id === s.id);
  const townName = esc(townById(curTown)?.name || curTown);
  const weekStr = s.w ? `Week ${String(s.w).padStart(3, '0')}` : '';
  const metaParts = [weekStr, esc(s.f || ''), s.wc ? esc(fmtWc(s.wc)) : ''].filter(Boolean);
  el.innerHTML = `
    <div class="stop-card">
      <div class="stop-card-hd">
        <span class="stop-town">Now stopped at · ${townName}</span>
        <span class="stop-card-meta">${metaParts.join(' · ')}</span>
      </div>
      <h2 class="stop-title">${esc(s.t)}</h2>
      ${s.aw ? `<p class="stop-desc">${esc(s.aw)}</p>` : ''}
      <div class="stop-actions">
        ${s.url ? `<a class="btn-read" href="${esc(s.url)}" target="_blank" rel="noopener">Read the story</a>` : ''}
        <button class="pickup-btn" data-id="${esc(s.id)}" ${inCarriage ? 'data-picked' : ''}>${inCarriage ? '✓ In your carriage' : 'Pick up · add to carriage'}</button>
      </div>
    </div>`;
  el.querySelector('.pickup-btn').onclick = () => toggleCarriage(s);
}

// ── out the window — stories in adjacent towns ──
function renderOutWindow() {
  const el = $('out-window'); if (!el) return;
  const adj = getAdjacentTowns();
  if (!adj.length) { el.innerHTML = ''; return; }

  const autoNext = getAutoNextTown();
  const nextTown = townById(autoNext);
  const curTownName = esc(townById(curTown)?.name || curTown);

  const cards = [];
  const usedTowns = new Set();
  for (const tid of adj) {
    if (cards.length >= 4) break;
    if (usedTowns.has(tid)) continue;
    const bridges = storiesInBothTowns(curTown, tid);
    if (!bridges.length) continue;
    const s = pickRandom(bridges);
    cards.push({ s, town: townById(tid) });
    usedTowns.add(tid);
  }
  if (!cards.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <p class="ow-label">Out the window · between ${curTownName} and ${esc(nextTown?.name || autoNext)}</p>
    <div class="ow-cards">
      ${cards.map(({ s, town }) => {
        const col = townColor(town?.id || s.towns[0]);
        const weekStr = s.w ? `Week ${String(s.w).padStart(3, '0')} · ` : '';
        return `<button class="ow-card" data-sid="${esc(s.id)}" data-tid="${esc(town?.id || s.towns[0])}">
          <div class="ow-town-bar" style="background:${col}"></div>
          <span class="ow-meta">${weekStr}${esc(s.f || '')}</span>
          <span class="ow-title">${esc(s.t)}</span>
          <span class="ow-hop">Hop off here →</span>
        </button>`;
      }).join('')}
    </div>`;

  el.querySelectorAll('.ow-card').forEach(card => {
    card.onclick = () => {
      const sid = card.dataset.sid, tid = card.dataset.tid;
      const story = stories.find(x => x.id === sid);
      if (!story || !tid) return;
      if (!route.includes(tid)) route.push(tid);
      curTown = tid;
      curStory = story;
      renderAll();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
  });
}

// ── next departures — 4 clickable stop options ──
function renderNextDepartures() {
  const el = $('next-departures'); if (!el) return;
  const autoNext = getAutoNextTown();
  const changelines = getChangeLineOptions(3);

  const opts = [];
  const addOpt = (tid) => {
    if (opts.length >= 4) return;
    const town = townById(tid); if (!town) return;
    const pool = storiesInBothTowns(curTown, tid).length
      ? storiesInBothTowns(curTown, tid) : storiesInTown(tid);
    const s = pickRandom(pool); if (!s) return;
    opts.push({ s, town });
  };
  addOpt(autoNext);
  changelines.forEach(t => addOpt(t.id));

  el.innerHTML = opts.map(({ s, town }) => {
    const title = s.t.length > 28 ? s.t.slice(0, 26) + '…' : s.t;
    return `<button class="nd-card" data-town="${esc(town.id)}">
      <span class="nd-title">${esc(title)}</span>
      <span class="nd-town">${esc(town.name)}</span>
    </button>`;
  }).join('');

  el.querySelectorAll('.nd-card').forEach(card => {
    card.onclick = () => moveToTown(card.dataset.town);
  });
}

// ── carriage panel (desktop sidebar) ──
function updateCarriagePanel() {
  const panel = $('carriage-panel'); if (!panel) return;
  const count = carriage.length;

  const itemsHtml = carriage.map(s => {
    const town = townById(s.towns[0]);
    const title = s.t.length > 32 ? s.t.slice(0, 30) + '…' : s.t;
    return `<div class="cp-item">
      <div class="cp-info">
        <span class="cp-town">${esc(town?.name || s.towns[0])} · ${esc(s.f || '')}</span>
        <span class="cp-item-title">${esc(title)}</span>
      </div>
      <button class="cp-rm" data-id="${esc(s.id)}" aria-label="Remove ${esc(s.t)}">×</button>
    </div>`;
  }).join('');

  let bridgeHtml = '';
  if (count >= 2) {
    const a = carriage[0], b = carriage[1];
    const ta = a.towns[0], tb = b.towns[0];
    const qs = questions[questionKey(ta, tb)] || [];
    const q = (qs.length ? pickRandom(qs) : 'What connects these two pieces?').replace(/\?$/, '<span class="q-signal">?</span>');
    const bridge = storiesInBothTowns(ta, tb).find(s => s.id !== a.id && s.id !== b.id);
    bridgeHtml = `<div class="cp-bridge">
      <p class="cp-where">Where they meet</p>
      <p class="cp-q">${q}</p>
      ${bridge ? `<p class="cp-src">Bridges: ${bridge.w ? 'Week ' + bridge.w + ' · ' : ''}<a href="${esc(bridge.url || '#')}" target="_blank" rel="noopener">${esc(bridge.t)}</a></p>` : ''}
    </div>`;
  }

  panel.innerHTML = `
    <div class="cp-hd">
      <span class="cp-title">Your carriage</span>
      <span class="cp-seats">${count} of 3 seats</span>
    </div>
    ${count === 0 ? '<p class="cp-empty">Pick up stories as you go. Up to 3 pieces travel with you.</p>' : ''}
    ${count > 0 ? `<div class="cp-items">${itemsHtml}</div>` : ''}
    ${count >= 2 ? `<button class="btn-combine" id="panel-combine">Combine these two</button>` : ''}
    ${bridgeHtml}
    <button class="btn-copy-ride" id="copy-ride">Copy link to this ride</button>`;

  panel.querySelectorAll('.cp-rm').forEach(btn => {
    btn.onclick = () => {
      const s = carriage.find(c => c.id === btn.dataset.id);
      if (s) toggleCarriage(s);
    };
  });
  const combineBtn = $('panel-combine');
  if (combineBtn) combineBtn.onclick = () => renderCombineSheet(0);
}

// ── render all ride components ──
function renderAll() {
  renderRoute();
  renderStop();
  renderOutWindow();
  renderNextDepartures();
  updateCarriagePanel();
  updateCarriageBar();
}

function moveToTown(tid) {
  const pool = storiesInBothTowns(curTown, tid).length
    ? storiesInBothTowns(curTown, tid)
    : storiesInTown(tid);
  if (!pool.length) return;
  if (!route.includes(tid)) route.push(tid);
  curTown = tid;
  curStory = pickRandom(pool);
  renderAll();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── carriage (fixed bottom bar) ──
function toggleCarriage(s) {
  const idx = carriage.findIndex(c => c.id === s.id);
  if (idx >= 0) {
    carriage.splice(idx, 1);
  } else {
    if (carriage.length >= 3) return;
    carriage.push(s);
  }
  updateCarriagePanel();
  updateCarriageBar();
  renderStop();
}

function updateCarriageBar() {
  const bar = $('carriage-bar');
  const chips = $('cb-chips');
  const combineBtn = $('cb-combine');
  if (!bar || !chips || !combineBtn) return;

  bar.hidden = carriage.length === 0;

  chips.innerHTML = carriage.map(s => {
    const title = s.t.length > 24 ? s.t.slice(0, 22) + '…' : s.t;
    return `<button class="cb-chip" data-id="${esc(s.id)}" aria-label="Remove ${esc(s.t)} from carriage">${esc(title)}<span class="chip-x">×</span></button>`;
  }).join('');

  chips.querySelectorAll('.cb-chip').forEach(chip => {
    chip.onclick = () => {
      const s = carriage.find(c => c.id === chip.dataset.id);
      if (s) { toggleCarriage(s); }
    };
  });

  combineBtn.hidden = carriage.length < 2;
  combineBtn.onclick = () => renderCombineSheet(0);
}

// ── combine sheet ──
function renderCombineSheet(pairIdx) {
  const sheet = $('combine-sheet'), inner = $('combine-inner');
  if (!sheet || !inner) return;
  const a = carriage[pairIdx], b = carriage[pairIdx + 1];
  if (!a || !b) return;
  const ta = a.towns[0], tb = b.towns[0];
  const qs = questions[questionKey(ta, tb)] || [];
  const q = qs.length ? pickRandom(qs) : 'What connects these two pieces?';
  const bridges = storiesInBothTowns(ta, tb).filter(s => s.id !== a.id && s.id !== b.id).slice(0, 3);
  const qHtml = q.replace(/\?$/, '<span class="q-signal">?</span>');

  inner.innerHTML = `
    <div class="combine-hd">
      <span>Combine</span>
      <button class="btn-ghost" id="close-combine" style="padding:4px 10px;min-height:0">Done</button>
    </div>
    <div class="combine-pair">
      <div class="combine-piece"><span class="cp-town">${esc(townById(ta)?.name || ta)}</span><strong>${esc(a.t)}</strong></div>
      <span class="combine-amp">+</span>
      <div class="combine-piece"><span class="cp-town">${esc(townById(tb)?.name || tb)}</span><strong>${esc(b.t)}</strong></div>
    </div>
    <p class="combine-q">${qHtml}</p>
    ${bridges.length ? `<div class="bridge-label">Bridge pieces</div><div class="bridge-row">${bridges.map(s=>`<div class="bridge-card"><span class="bc-town">${esc(s.towns.map(t=>townById(t)?.name).join(', '))}</span><strong>${esc(s.t)}</strong>${s.url?`<a href="${esc(s.url)}" target="_blank" class="bc-link">Read</a>`:''}</div>`).join('')}</div>` : ''}
    ${carriage.length > 2 ? `<button class="btn-ghost" id="next-combine" style="margin-top:16px">Next pair →</button>` : ''}
  `;
  sheet.hidden = false;
  $('close-combine').onclick = () => { sheet.hidden = true; };
  const nextBtn = $('next-combine');
  if (nextBtn) nextBtn.onclick = () => renderCombineSheet((pairIdx + 1) % (carriage.length - 1));
  sheet.onclick = e => { if (e.target === sheet) sheet.hidden = true; };
}

// ── URL sharing ──
function encodeState() {
  const r = route.join(',');
  const c = carriage.map(s => s.id).join(',');
  const params = new URLSearchParams({ r, s: curStory?.id || '', ...(c ? { c } : {}) });
  return location.pathname + '?' + params.toString();
}

function restoreFromURL() {
  const p = new URLSearchParams(location.search);
  const r = p.get('r'), sid = p.get('s') || p.get('board'), c = p.get('c');
  if (sid) {
    const s = stories.find(x => x.id === sid);
    if (s) {
      route = r ? r.split(',') : [s.towns[0]];
      curTown = route[route.length - 1];
      curStory = s;
      carriage = c ? c.split(',').map(id => stories.find(x => x.id === id)).filter(Boolean) : [];
      updateCarriageBar();
      showRide();
      renderAll();
      return true;
    }
  }
  if (r) {
    const tids = r.split(',');
    const tid = tids[tids.length - 1];
    if (townById(tid)) { boardTown(tid); return true; }
  }
  return false;
}

document.addEventListener('click', async e => {
  const btn = e.target.closest('#copy-ride'); if (!btn) return;
  const url = location.origin + encodeState();
  try { await navigator.clipboard.writeText(url); } catch(err) {}
});

// ── init ──
if (!restoreFromURL()) showLobby();
}
