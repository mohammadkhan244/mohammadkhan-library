{
const D = JSON.parse(document.getElementById('data').textContent);
const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const phone = () => window.innerWidth <= 640;

// ── Scale stage to viewport ──────────────────────────────
const wrap  = document.getElementById('home-wrap');
const stage = document.getElementById('home-stage');

function scaleStage() {
  if (phone()) { stage.style.removeProperty('--hscale'); wrap.style.removeProperty('--hs'); return; }
  const scale = Math.min(1, window.innerWidth / 1280);
  stage.style.setProperty('--hscale', scale);
  wrap.style.setProperty('--hs', (800 * scale) + 'px');
}
scaleStage();
window.addEventListener('resize', scaleStage);

// ── Phone: build arch-row + pill-row wrappers ────────────
function buildPhoneWrappers() {
  if (!phone()) return;
  if (document.querySelector('.hs-arch-row')) return; // already built

  const archRow = document.createElement('div');
  archRow.className = 'hs-arch-row';
  const pillRow = document.createElement('div');
  pillRow.className = 'hs-pill-row';

  const arches = [...document.querySelectorAll('.hs-arch, .hs-arch--disabled')];
  const pills  = [...document.querySelectorAll('.hs-pill')];

  arches.forEach(a => archRow.appendChild(a));
  pills.forEach(p => pillRow.appendChild(p));

  // Insert arch-row before the floor
  const floor = document.getElementById('hs-floor');
  stage.insertBefore(archRow, floor);

  // Insert pill-row after arch-row
  archRow.after(pillRow);
}
buildPhoneWrappers();

// ── Floor ────────────────────────────────────────────────
function buildFloor() {
  const el = document.getElementById('hs-floor');
  if (!el) return;
  const cols = phone() ? 13 : 32;
  const count = cols * 4;
  // Use last `count` entries from weekHeat (128 available)
  const heat = D.weekHeat.slice(-count);
  const frag = document.createDocumentFragment();
  const tickIdx = new Set();
  if (!reduced) {
    // Pick ~6 random squares to tick (from first 2 rows, non-zero)
    for (let i = 0; i < count / 2; i++) {
      if (heat[i] > 0 && tickIdx.size < 6 && Math.random() < 0.08) tickIdx.add(i);
    }
  }
  heat.forEach((lvl, i) => {
    const sq = document.createElement('div');
    sq.className = 'hs-sq' + (tickIdx.has(i) ? ' hs-sq--tick' : '');
    sq.style.setProperty('--c', `var(--heat-${lvl})`);
    if (!reduced && tickIdx.has(i)) {
      sq.style.animationDelay = (Math.random() * -6).toFixed(1) + 's';
    }
    frag.appendChild(sq);
  });
  el.appendChild(frag);
}
buildFloor();

// ── Stacks spines ────────────────────────────────────────
function buildSpines() {
  const el = document.getElementById('hs-spines');
  if (!el) return;
  const frag = document.createDocumentFragment();
  D.spines.forEach(sp => {
    const d = document.createElement('div');
    d.className = 'hs-spine';
    d.style.cssText = `width:${sp.w}px;height:${sp.h}px;background:${sp.c};flex-shrink:0`;
    frag.appendChild(d);
  });
  el.appendChild(frag);
}
buildSpines();

// ── Train rain ────────────────────────────────────────────
function buildRain() {
  const el = document.getElementById('hs-rain');
  if (!el || reduced) return;
  // 14 rain streaks with fixed pseudo-random layout
  const streaks = [
    {x:14, h:52, dur:3.8, dl:-1.2},
    {x:38, h:36, dur:4.6, dl:-2.9},
    {x:62, h:68, dur:3.2, dl:-0.4},
    {x:88, h:44, dur:5.1, dl:-3.7},
    {x:110, h:76, dur:3.6, dl:-1.8},
    {x:132, h:48, dur:4.8, dl:-4.2},
    {x:152, h:40, dur:3.4, dl:-0.9},
    {x:174, h:60, dur:5.4, dl:-2.5},
    {x:196, h:36, dur:4.1, dl:-3.1},
    {x:218, h:72, dur:3.9, dl:-1.4},
    {x:28,  h:56, dur:4.3, dl:-4.8},
    {x:76,  h:44, dur:5.0, dl:-0.6},
    {x:124, h:64, dur:3.7, dl:-3.4},
    {x:168, h:48, dur:4.5, dl:-2.1},
  ];
  const frag = document.createDocumentFragment();
  streaks.forEach(s => {
    const d = document.createElement('div');
    d.className = 'hs-streak';
    d.style.cssText = `left:${s.x}px;height:${s.h}px;top:-80px;--dur:${s.dur}s;--delay:${s.dl}s`;
    frag.appendChild(d);
  });
  el.appendChild(frag);
}
buildRain();

// ── Train flap board ──────────────────────────────────────
function buildBoard() {
  const el = document.getElementById('hs-board');
  if (!el) return;
  const towns = ['SCI-FI', 'HORROR', 'MAKING'];
  const frag = document.createDocumentFragment();
  towns.forEach((name, ri) => {
    const row = document.createElement('div');
    row.className = 'hs-board-row';
    // Pad/truncate to exactly 6 chars
    const chars = name.padEnd(6, ' ').slice(0, 6);
    chars.split('').forEach((ch, ci) => {
      const cell = document.createElement('div');
      cell.className = 'hs-cell';
      cell.textContent = ch;
      if (!reduced) {
        const delay = -(ri * 0.35 + ci * 0.09);
        cell.style.cssText = `--fdur:9s;--fdelay:${delay.toFixed(2)}s`;
      }
      row.appendChild(cell);
    });
    frag.appendChild(row);
  });
  el.appendChild(frag);
}
buildBoard();

// ── Pause animations when tab hidden or stage offscreen ──
let paused = false;
function setPause(state) {
  if (paused === state) return;
  paused = state;
  const els = document.querySelectorAll('.hs-streak,.hs-cell,.hs-sq--tick');
  els.forEach(e => e.style.animationPlayState = state ? 'paused' : '');
}

document.addEventListener('visibilitychange', () => setPause(document.hidden));

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(entries => {
    setPause(!entries[0].isIntersecting);
  }, { threshold: 0 });
  io.observe(stage);
}
}
