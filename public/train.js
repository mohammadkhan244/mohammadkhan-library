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
const FLAP = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-:.,\'';
const BOARD_ROWS = 6;
let boardInterval = null;

function makeFlapRow(title, town) {
  const pad = 32, tpad = 12;
  const tSlot = title.toUpperCase().slice(0, pad).padEnd(pad, ' ');
  const nSlot = town.toUpperCase().slice(0, tpad).padEnd(tpad, ' ');
  const chars = [...tSlot, ...nSlot];
  const spans = chars.map((c, i) => `<span class="flap-ch" data-i="${i}">${esc(c)}</span>`).join('');
  return `<div class="depart-row">${spans}</div>`;
}

function animateRow(rowEl, newTitle, newTown, reduced) {
  const pad = 32, tpad = 12;
  const target = [...(newTitle.toUpperCase().slice(0, pad).padEnd(pad, ' ')), ...(newTown.toUpperCase().slice(0, tpad).padEnd(tpad, ' '))];
  const spans = rowEl.querySelectorAll('.flap-ch');
  spans.forEach((sp, i) => {
    if (reduced) { sp.textContent = target[i]; return; }
    let f = 0, frames = 4 + Math.floor(Math.random() * 5);
    const iv = setInterval(() => {
      if (f++ < frames) sp.textContent = FLAP[Math.floor(Math.random() * FLAP.length)];
      else { sp.textContent = target[i]; clearInterval(iv); }
    }, 50);
  });
}

function buildBoard() {
  const board = $('depart-rows'); if (!board) return;
  const newest = [...stories].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 10);
  let rowStories = [...newest];
  while (rowStories.length < BOARD_ROWS) rowStories = [...rowStories, ...newest];
  rowStories = rowStories.slice(0, BOARD_ROWS);

  board.innerHTML = rowStories.map(s => makeFlapRow(s.t, townById(s.towns[0])?.name || '')).join('');
  board.querySelectorAll('.depart-row').forEach((row, i) => {
    row.onclick = () => board_(rowStories[i]);
  });

  if (boardInterval) clearInterval(boardInterval);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  boardInterval = setInterval(() => {
    board.querySelectorAll('.depart-row').forEach(row => {
      const next = pickRandom(stories);
      row.onclick = () => board_(next);
      animateRow(row, next.t, townById(next.towns[0])?.name || '', reduced);
    });
  }, 3000);
}

// ── boarding ──
function board_(story) {
  if (!story) return;
  curStory = story;
  curTown = story.towns[0];
  route = [curTown];
  carriage = [];
  updateCarriageBar();
  showRide();
  renderRoute();
  renderStop();
  renderNextActions();
  if (boardInterval) { clearInterval(boardInterval); boardInterval = null; }
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
}

function showRide() {
  $('train-lobby').hidden = true;
  $('train-ride').hidden = false;
}

$('back-to-lobby').onclick = showLobby;

// ── route strip — dots on a line ──
function renderRoute() {
  const bar = $('route-bar'); if (!bar) return;
  const parts = [];
  route.forEach((tid, i) => {
    const isCur = i === route.length - 1;
    const t = townById(tid);
    const name = esc(t?.name || tid);
    parts.push(
      `<div class="rd-seg" ${isCur ? 'data-cur' : ''} data-town="${esc(tid)}">` +
        `<button class="rd-dot ${isCur ? '' : 'rd-past'}" aria-label="Jump back to ${name}" ${isCur ? 'disabled' : ''}></button>` +
        `<span class="rd-name">${name}</span>` +
      `</div>`
    );
    if (!isCur) parts.push('<span class="rd-track" aria-hidden="true"></span>');
  });
  bar.innerHTML = parts.join('');
  bar.querySelectorAll('.rd-past').forEach(btn => {
    btn.onclick = () => {
      const tid = btn.closest('[data-town]').dataset.town;
      const idx = route.indexOf(tid);
      if (idx < 0) return;
      route = route.slice(0, idx + 1);
      curTown = tid;
      const ss = storiesInTown(tid);
      if (ss.length) curStory = pickRandom(ss);
      renderRoute(); renderStop(); renderNextActions();
    };
  });
}

// ── current stop card ──
function renderStop() {
  const el = $('current-stop'); if (!el || !curStory) return;
  const s = curStory;
  const inCarriage = carriage.some(c => c.id === s.id);
  const townName = esc(townById(curTown)?.name || curTown);
  const pickupLabel = inCarriage ? '✓ In your carriage' : 'Pick up';
  el.innerHTML = `
    <div class="stop-card">
      <div class="stop-town">${townName}</div>
      <h2 class="stop-title">${esc(s.t)}</h2>
      <p class="stop-meta">${esc(s.f || '')}${s.wc ? ' · ' + esc(fmtWc(s.wc)) : ''}${s.aw ? ' · <em>' + esc(s.aw) + '</em>' : ''}</p>
      <div class="stop-actions">
        ${s.url ? `<a class="btn-primary" href="${esc(s.url)}" target="_blank" rel="noopener">Read</a>` : ''}
        <button class="pickup-btn" data-id="${esc(s.id)}" ${inCarriage ? 'data-picked' : ''}>${esc(pickupLabel)}</button>
      </div>
    </div>`;
  el.querySelector('.pickup-btn').onclick = () => toggleCarriage(s);
}

// ── next-stop actions (primary + 2 change-line options) ──
function renderNextActions() {
  const el = $('next-actions'); if (!el) return;
  const autoNext = getAutoNextTown();
  const autoTown = townById(autoNext);
  const changelines = getChangeLineOptions(2);
  el.innerHTML = `
    <button class="btn-next-stop" id="btn-next-stop">Next stop →</button>
    ${changelines.map(t =>
      `<button class="btn-change-line" data-town="${esc(t.id)}">Change line · ${esc(t.name)}</button>`
    ).join('')}`;

  $('btn-next-stop').onclick = () => {
    const tid = getAutoNextTown();
    moveToTown(tid);
  };
  el.querySelectorAll('.btn-change-line').forEach(btn => {
    btn.onclick = () => moveToTown(btn.dataset.town);
  });
}

function moveToTown(tid) {
  const pool = storiesInBothTowns(curTown, tid).length
    ? storiesInBothTowns(curTown, tid)
    : storiesInTown(tid);
  if (!pool.length) return;
  if (!route.includes(tid)) route.push(tid);
  curTown = tid;
  curStory = pickRandom(pool);
  renderRoute(); renderStop(); renderNextActions();
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
      renderRoute(); renderStop(); renderNextActions();
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
