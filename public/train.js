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
let route = [];          // array of town IDs visited
let curTown = '';        // current town ID
let curStory = null;     // current story object
let carriage = [];       // picked-up story objects (max 3)
let combineIdx = 0;      // index into carriage pair being combined

// ── helpers ──
const townById = id => towns.find(t => t.id === id);
const storiesInTown = id => stories.filter(s => s.towns.includes(id));
const storiesInBothTowns = (a, b) => stories.filter(s => s.towns.includes(a) && s.towns.includes(b));
const questionKey = (a, b) => [a, b].sort().join('|');
const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

function toast(msg) {
  const el = $('train-toast'); if (!el) return;
  el.textContent = msg; el.classList.add('on');
  clearTimeout(el._tt); el._tt = setTimeout(() => el.classList.remove('on'), 2000);
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

  // Add click handlers
  board.querySelectorAll('.depart-row').forEach((row, i) => {
    row.style.cursor = 'pointer';
    row.onclick = () => board_(rowStories[i]);
  });

  // Cycle through stories every 3 seconds
  if (boardInterval) clearInterval(boardInterval);
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  boardInterval = setInterval(() => {
    const rows = board.querySelectorAll('.depart-row');
    rows.forEach((row, i) => {
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
  updateCarriage();
  showRide();
  renderStop();
  renderWindow();
  renderRoute();
  if (boardInterval) { clearInterval(boardInterval); boardInterval = null; }
}

function boardTown(townId) {
  const ss = storiesInTown(townId);
  if (!ss.length) return;
  board_(pickRandom(ss));
}

$('board-random').onclick = () => {
  const t = pickRandom(towns);
  boardTown(t.id);
};

$('town-index').addEventListener('click', e => {
  const btn = e.target.closest('[data-town]'); if (!btn) return;
  boardTown(btn.dataset.town);
});

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

// ── route bar ──
function renderRoute() {
  const bar = $('route-bar'); if (!bar) return;
  bar.innerHTML = route.map((tid, i) => {
    const t = townById(tid);
    const isCur = i === route.length - 1;
    return `<span class="route-town ${isCur ? 'route-cur' : 'route-vis'}">${esc(t?.name || tid)}</span>${i < route.length - 1 ? '<span class="route-sep">→</span>' : ''}`;
  }).join('');
}

// ── current stop card ──
function renderStop() {
  const el = $('current-stop'); if (!el || !curStory) return;
  const s = curStory;
  const inCarriage = carriage.some(c => c.id === s.id);
  el.innerHTML = `
    <div class="stop-card">
      <div class="stop-town">${esc(townById(curTown)?.name || curTown)}</div>
      <h2 class="stop-title">${esc(s.t)}</h2>
      <p class="stop-meta">${esc(s.f || '')}${s.wc ? ' · ' + esc(fmtWc(s.wc)) : ''}${s.aw ? ' · <em>' + esc(s.aw) + '</em>' : ''}</p>
      <div class="stop-actions">
        ${s.url ? `<a class="btn-primary" href="${esc(s.url)}" target="_blank" rel="noopener">Read</a>` : ''}
        <button class="btn-sec pickup-btn" data-id="${s.id}" ${inCarriage ? 'disabled' : ''}>${inCarriage ? 'In carriage' : 'Pick up'}</button>
      </div>
    </div>`;
  el.querySelector('.pickup-btn')?.addEventListener('click', () => pickUp(s));
}

// ── window stories ──
function renderWindow() {
  const el = $('window-row'); if (!el) return;
  const nextTown = getNextTown();
  const pool = [...new Set([
    ...storiesInTown(curTown).filter(s => s.id !== curStory?.id),
    ...(nextTown ? storiesInBothTowns(curTown, nextTown) : []),
  ])].slice(0, 6);
  if (!pool.length) { el.innerHTML = '<p class="empty-window">End of the line. <button class="btn-ghost" id="new-train">Start a new ride</button></p>'; $('new-train')?.addEventListener('click', showLobby); return; }
  el.innerHTML = pool.map(s => `
    <div class="window-card">
      <div class="wc-town">${esc(s.towns.map(t => townById(t)?.name).join(', '))}</div>
      <strong class="wc-title">${esc(s.t)}</strong>
      <p class="wc-meta">${esc(s.f || '')}${s.wc ? ' · ' + Math.round(s.wc/238) + ' min' : ''}</p>
      <button class="btn-ghost hop-btn" data-id="${s.id}">Hop off here</button>
    </div>`).join('');
  el.querySelectorAll('.hop-btn').forEach(btn => {
    btn.onclick = () => {
      const s = stories.find(x => x.id === btn.dataset.id); if (!s) return;
      const newTown = s.towns[0];
      if (!route.includes(newTown)) route.push(newTown);
      curTown = newTown; curStory = s;
      renderRoute(); renderStop(); renderWindow();
    };
  });
}

function getNextTown() {
  const idx = route.indexOf(curTown);
  if (idx < route.length - 1) return route[idx + 1];
  // Pick a new adjacent town based on shared stories
  const candidates = towns.map(t => t.id).filter(tid => tid !== curTown && storiesInBothTowns(curTown, tid).length > 0);
  return candidates.length ? pickRandom(candidates) : null;
}

// ── carriage ──
function pickUp(s) {
  if (carriage.length >= 3 || carriage.some(c => c.id === s.id)) return;
  carriage.push(s);
  updateCarriage();
  renderStop();
  toast('Picked up "' + s.t + '"');
}

function dropFromCarriage(id) {
  carriage = carriage.filter(c => c.id !== id);
  updateCarriage();
  renderStop();
}

function updateCarriage() {
  const el = $('carriage-slots'), count = $('carriage-count');
  if (count) count.textContent = carriage.length ? '(' + carriage.length + ')' : '';
  if (!el) return;
  if (!carriage.length) { el.innerHTML = '<p class="carriage-empty">Pick up pieces as you ride.</p>'; }
  else {
    el.innerHTML = carriage.map(s => `
      <div class="carriage-item" data-id="${s.id}">
        <div class="ci-town">${esc(s.towns.map(t => townById(t)?.name).join(', '))}</div>
        <strong>${esc(s.t)}</strong>
        <button class="ci-drop" data-id="${s.id}" aria-label="Remove">×</button>
      </div>`).join('');
    el.querySelectorAll('.ci-drop').forEach(btn => { btn.onclick = () => dropFromCarriage(btn.dataset.id); });
    if (carriage.length >= 2) {
      el.insertAdjacentHTML('beforeend', `<button class="btn-sec" id="combine-btn" style="margin-top:10px;width:100%">Combine these two</button>`);
      $('combine-btn').onclick = () => renderCombine(0);
    }
  }
  $('combine-view').hidden = true;
}

function renderCombine(pairIdx) {
  const cv = $('combine-view'); if (!cv) return;
  const a = carriage[pairIdx], b = carriage[pairIdx + 1]; if (!a || !b) return;
  const ta = a.towns[0], tb = b.towns[0];
  const qKey = questionKey(ta, tb);
  const qs = questions[qKey] || [];
  const q = qs.length ? pickRandom(qs) : 'What connects these two pieces?';
  const bridges = storiesInBothTowns(ta, tb).filter(s => s.id !== a.id && s.id !== b.id).slice(0, 3);
  const qHtml = q.replace(/\?$/, '<span class="q-signal">?</span>');

  cv.hidden = false;
  cv.innerHTML = `
    <div class="combine-wrap">
      <h3 class="combine-hd">Combine</h3>
      <div class="combine-pair">
        <div class="combine-piece"><span class="cp-town">${esc(townById(ta)?.name || ta)}</span><strong>${esc(a.t)}</strong></div>
        <span class="combine-amp">+</span>
        <div class="combine-piece"><span class="cp-town">${esc(townById(tb)?.name || tb)}</span><strong>${esc(b.t)}</strong></div>
      </div>
      <p class="combine-q">${qHtml}</p>
      ${bridges.length ? `<div class="bridge-label">Bridge pieces</div><div class="bridge-row">${bridges.map(s => `<div class="bridge-card"><span class="bc-town">${esc(s.towns.map(t=>townById(t)?.name).join(', '))}</span><strong>${esc(s.t)}</strong>${s.url?`<a href="${esc(s.url)}" target="_blank" class="bc-link">Read</a>`:''}</div>`).join('')}</div>` : ''}
      <button class="btn-ghost" id="close-combine" style="margin-top:16px">Done</button>
    </div>`;
  $('close-combine').onclick = () => { cv.hidden = true; };
}

// ── carriage panel toggle on phone ──
$('show-carriage').onclick = () => {
  const c = $('carriage');
  c.classList.toggle('carriage-open');
};
$('carriage-close').onclick = () => {
  $('carriage').classList.remove('carriage-open');
};

// ── URL sharing ──
function encodeState() {
  const r = route.join(',');
  const c = carriage.map(s => s.id).join(',');
  const params = new URLSearchParams({ r, ...(c ? { c } : {}), s: curStory?.id || '' });
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
      updateCarriage();
      showRide();
      renderRoute();
      renderStop();
      renderWindow();
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

// ── copy ride link ──
document.addEventListener('click', async e => {
  const btn = e.target.closest('#copy-ride'); if (!btn) return;
  const url = location.origin + encodeState();
  try { await navigator.clipboard.writeText(url); toast('Ride link copied'); } catch(err) { toast(url); }
});

// ── init ──
if (!restoreFromURL()) showLobby();
}
