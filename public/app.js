{
const D = JSON.parse(document.getElementById('data').textContent);

// Spine colours — reference CSS variables from theme.css (no hex in JS).
const FC = {
  'Short Story':     'var(--spine-short-story)',
  'Screenplay':      'var(--spine-screenplay)',
  'Poem':            'var(--spine-poem)',
  'Rap':             'var(--spine-rap)',
  'Essay':           'var(--spine-essay)',
  'Memoir':          'var(--spine-memoir)',
  'Newsletter Post': 'var(--spine-post)',
  'StagePlay':       'var(--spine-rap)',
  'Song':            'var(--spine-rap)',
  'Anthology':       'var(--spine-rap)',
};
const DEWEY_LABELS = { '100': 'Philosophy & Meaning', '808': 'Writing & Learning', '650': 'Work & Business', '600': 'Technology' };

const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = id => document.getElementById(id);

const seen = {};
const uid = base => { let id = base, n = 2; while (seen[id]) id = base + '-' + n++; seen[id] = 1; return id; };
const stories = D.stories.map(s => ({ ...s, id: uid('s-' + (s.w || slug(s.t))) }));
const posts = D.posts.map(p => ({ ...p, id: uid('p-' + slug(p.url.split('/p/')[1] || p.t)), yr: p.d.slice(0, 4) }));
const tools = D.tools.map(t => ({ ...t, id: uid('t-' + slug(t.t)) }));
const projects = (D.projects || []).map(p => ({ ...p, id: uid('x-' + slug(p.t)), url: p.links[0]?.[1] || '' }));
const books = (D.books || []).map((b, i) => ({ ...b, id: 'b-' + i, yr: (b.lastRead || '').slice(0, 4) }));

const span = p => {
  const f = d => new Date(d.length > 7 ? d + 'T12:00' : d + '-15T12:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  return f(p.d) + (p.ongoing ? ' – Ongoing' : p.end ? ' – ' + f(p.end) : '');
};
const stars = r => {
  if (r === null || r === undefined) return '';
  const full = Math.floor(r), half = r - full >= 0.5 ? 1 : 0, empty = 5 - full - half;
  return '<span class="stars" aria-label="' + r + ' stars">'+
    '★'.repeat(full) + (half ? '½' : '') + '<span style="opacity:.3">' + '★'.repeat(empty) + '</span></span>';
};

const TINT = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h} 35% 55%)`; };
const tag = s => s ? `<span class="tag" style="--t:color-mix(in srgb,${esc(FC[s] || 'var(--accent)')} 20%,var(--bg))">${esc(s)}</span>` : '';
const thumb = (x, label, cls = '') => `<div class="th ${cls}" style="--fc:${FC[x.f] || TINT(x.t)}"><span>${esc(label)}</span>${x.img ? `<img loading="lazy" alt="" src="${esc(x.img)}" onerror="this.remove()">` : ''}</div>`;
const fmtD = d => new Date(d + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/* ── theme toggle ── */
(function () {
  const btn = $('theme-toggle');
  const sun  = $('icon-sun');
  const moon = $('icon-moon');
  if (!btn) return;

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('theme', t); } catch (e) {}
    const isDark = t === 'dark';
    sun.style.display  = isDark ? '' : 'none';
    moon.style.display = isDark ? 'none' : '';
    btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
  }

  const current = document.documentElement.getAttribute('data-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(current);

  btn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
})();

/* ── build tracker ── */
const made = [
  ...stories.map(s => ({ k: 'Story',      d: s.d, t: (s.w ? 'Week ' + s.w + ': ' : '') + s.t, id: s.id, url: s.url })),
  ...posts.map(p =>   ({ k: 'Newsletter',  d: p.d, t: p.t, id: p.id, url: p.url })),
  ...tools.map(t =>   ({ k: 'Tool',        d: t.d, t: t.t, id: t.id, url: t.url })),
  ...projects.map(p => ({ k: 'Project',   d: p.d, t: p.t, id: p.id, url: '#' + p.id })),
];
const wk = d => { const x = new Date(d + 'T12:00'), j = new Date(x.getFullYear(), 0, 1, 12); return [x.getFullYear(), Math.min(52, Math.floor((x - j) / 864e5 / 7))]; };
const mon = d => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
let kind = '', selCell = '';

function tracker() {
  const items = made.filter(m => !kind || m.k === kind), by = {}, yrs = {};
  for (const m of items) { const [y, w] = wk(m.d); (by[y + '-' + w] ??= []).push(m); yrs[y] = (yrs[y] || 0) + 1; }
  const ws = [...new Set(items.map(m => mon(m.d)))].sort(); let best = 0, run = 0, prev = 0;
  for (const w of ws) { const t = new Date(w).getTime(); run = prev && t - prev < 8 * 864e5 ? run + 1 : 1; best = Math.max(best, run); prev = t; }
  const now = new Date().getFullYear(), first = Math.min(now, ...items.map(m => +m.d.slice(0, 4))), Y = [];
  for (let y = now; y >= first; y--) Y.push(y);

  $('stats').innerHTML = `<div><b>${items.length}</b><span>things made</span></div><div><b>${ws.length}</b><span>weeks with something new</span></div><div><b>${best}</b><span>longest run of weeks in a row</span></div><div><b>${yrs[now] || 0}</b><span>made in ${now}</span></div>`;

  const lvl = n => `var(--heat-${Math.min(n, 4)})`;

  $('grid').innerHTML = Y.map(y =>
    `<div class="yr"><span>${y}</span><div class="cells">${Array.from({ length: 53 }, (_, w) => {
      const a = by[y + '-' + w] || [];
      return `<button data-c="${y}-${w}" aria-pressed="${selCell === y + '-' + w}" aria-label="${y} week ${w + 1}: ${a.length} made" title="${a.length ? a.length + ' made' : ''}" style="--c:${lvl(a.length)}"></button>`;
    }).join('')}</div><span>${yrs[y] || 0}</span></div>`
  ).join('');

  const det = $('det'), a = by[selCell] || []; det.hidden = !selCell;
  if (selCell) {
    const [y, w] = selCell.split('-'); const j = new Date(+y, 0, 1 + w * 7);
    det.innerHTML = `<strong>Week of ${j.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>${a.length ? `<ul>${a.map(m => `<li><span class="k">${m.k}</span><a href="${esc(m.url || '#' + m.id)}">${esc(m.t)}</a></li>`).join('')}</ul>` : '<p style="margin:6px 0 0;color:var(--muted)">Nothing published this week.</p>'}`;
  }
}

if ($('stats')) {
  $('grid').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; selCell = selCell === b.dataset.c ? '' : b.dataset.c; tracker(); });
  $('chips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; kind = b.dataset.k; $('chips').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); selCell = ''; tracker(); });
  tracker();

  // Scroll the grid so the current week column is visible
  (function scrollToCurrentWeek() {
    const today = new Date().toISOString().slice(0, 10);
    const [cy, cw] = wk(today);
    const btn = document.querySelector(`.cells button[data-c="${cy}-${cw}"]`);
    if (btn) btn.scrollIntoView({ inline: 'end', block: 'nearest' });
  })();

  /* ── Tracker / Charts toggle ── */
  const showTrackerView = function(which) {
    const tv = $('tracker-view'), cv = $('charts-view');
    const isCharts = which === 'charts';
    tv.hidden = isCharts;
    cv.hidden = !isCharts;
    $('tab-tracker').setAttribute('aria-pressed', !isCharts);
    $('tab-charts').setAttribute('aria-pressed', isCharts);
    if (isCharts && !cv.dataset.ready) { renderCharts(); cv.dataset.ready = '1'; }
  };
  document.querySelector('.trk-hd .seg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    showTrackerView(b.id === 'tab-charts' ? 'charts' : 'tracker');
  });
}

/* ── Charts ── */
function barChart(title, rows, fmtVal, takeaway) {
  if (!rows.length || rows.every(r => !r.val))
    return `<div class="chart"><h4>${esc(title)}</h4><p class="chart-empty">No data yet — available once word counts are synced from Notion.</p></div>`;
  const max = Math.max(...rows.map(r => r.val));
  const bars = rows.map(r => {
    const pct = max ? Math.round(r.val / max * 100) : 0;
    const col = FC[r.label] || 'var(--accent)';
    return `<div class="bar-row"><span class="bar-lbl">${esc(r.label)}</span><div class="bar-trk"><div class="bar-fill" style="width:${pct}%;background:${col}"></div><span class="bar-num">${esc(fmtVal(r.val))}</span></div></div>`;
  }).join('');
  return `<div class="chart"><h4>${esc(title)}</h4><div class="bars">${bars}</div><p class="chart-note">${takeaway}</p></div>`;
}

function renderCharts() {
  const cv = $('charts-view');
  const ss = stories.filter(s => s.f);
  const loc = n => n.toLocaleString();

  /* 1. stories by format */
  const byFmt = {};
  ss.forEach(s => { byFmt[s.f] = (byFmt[s.f] || 0) + 1; });
  const fmtRows = Object.entries(byFmt).sort((a, b) => b[1] - a[1]).map(([label, val]) => ({ label, val }));
  const topFmt = fmtRows[0];
  const c1 = barChart('Stories by format', fmtRows, n => String(n),
    topFmt ? `${topFmt.label}s make up ${Math.round(topFmt.val / ss.length * 100)}% of all ${ss.length} stories.` : '');

  /* 2. words by format */
  const wByFmt = {};
  ss.forEach(s => { if (s.wc > 0) wByFmt[s.f] = (wByFmt[s.f] || 0) + s.wc; });
  const wFmtRows = Object.entries(wByFmt).sort((a, b) => b[1] - a[1]).map(([label, val]) => ({ label, val }));
  const topWFmt = wFmtRows[0];
  const totalW = wFmtRows.reduce((s, r) => s + r.val, 0);
  const c2 = barChart('Words by format', wFmtRows, loc,
    topWFmt && totalW ? `${topWFmt.label}s account for ${Math.round(topWFmt.val / totalW * 100)}% of all words written.` : '');

  /* 3. words per year */
  const wByYr = {};
  ss.forEach(s => { if (s.wc > 0) { const y = s.d.slice(0, 4); wByYr[y] = (wByYr[y] || 0) + s.wc; } });
  const wYrRows = Object.entries(wByYr).sort((a, b) => a[0].localeCompare(b[0])).map(([label, val]) => ({ label, val }));
  const topWYr = wYrRows.reduce((best, r) => !best || r.val > best.val ? r : best, null);
  const c3 = barChart('Words per writing year', wYrRows, loc,
    topWYr ? `${topWYr.label} was the most productive year with ${loc(topWYr.val)} words written.` : '');

  /* 4. average story length per year */
  const sumByYr = {}, cntByYr = {};
  ss.forEach(s => { if (s.wc > 0) { const y = s.d.slice(0, 4); sumByYr[y] = (sumByYr[y] || 0) + s.wc; cntByYr[y] = (cntByYr[y] || 0) + 1; } });
  const avgYrRows = Object.entries(sumByYr).sort((a, b) => a[0].localeCompare(b[0])).map(([y, tot]) => ({ label: y, val: Math.round(tot / cntByYr[y]) }));
  const firstYr = avgYrRows[0], lastYr = avgYrRows[avgYrRows.length - 1];
  const lengthTakeaway = firstYr && lastYr && firstYr.label !== lastYr.label
    ? `Year ${firstYr.label} averaged ${loc(firstYr.val)} words. ${lastYr.label}: ${loc(lastYr.val)} — ${firstYr.val > lastYr.val ? 'shorter, sharper, still weekly.' : 'longer, richer, still weekly.'}`
    : '';
  const c4 = barChart('Average story length per year', avgYrRows, n => loc(n) + ' wds', lengthTakeaway);

  /* 5. stories by genre (top 10) */
  const byGenre = {};
  ss.forEach(s => s.g.forEach(g => { if (g && g !== s.f) byGenre[g] = (byGenre[g] || 0) + 1; }));
  const genreRows = Object.entries(byGenre).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, val]) => ({ label, val }));
  const topGenre = genreRows[0];
  const c5 = barChart('Stories by genre', genreRows, n => String(n),
    topGenre ? `${topGenre.label} is the most common genre, appearing in ${topGenre.val} stories.` : '');

  cv.innerHTML = `<div class="charts-grid">${c1}${c2}${c3}${c4}${c5}</div>`;
}

// Pre-computed WCAG text colors for each spine bg (see lib/contrast.js for ratios).
// --call-label-bg (light) or --call-label-text (dark) — whichever gives higher contrast.
const SPINE_TEXT_COLOR = {
  'var(--spine-short-story)': 'var(--call-label-bg)',   // dark blue:    8.4:1 light wins
  'var(--spine-screenplay)':  'var(--call-label-bg)',   // burnt sienna: 4.4:1 light wins
  'var(--spine-poem)':        'var(--call-label-text)', // ivory:       11.8:1 dark wins
  'var(--spine-rap)':         'var(--call-label-bg)',   // olive:        5.5:1 light wins
  'var(--spine-essay)':       'var(--call-label-bg)',   // slate:        high  light wins
  'var(--spine-memoir)':      'var(--call-label-bg)',   // brown:        5.8:1 light wins
  'var(--spine-post)':        'var(--call-label-text)', // buff orange:  7.7:1 dark wins
};

// canvas measureText for exact vertical text fitting.
// In writing-mode:vertical-rl, each Latin char's height in the column ≈ its horizontal advance.
let _spineCanvas;
function fitSpineText(title, baseH) {
  if (!_spineCanvas) _spineCanvas = document.createElement('canvas');
  const ctx = _spineCanvas.getContext('2d');
  const avail = baseH - 22; // minus padding + call-num-tag
  for (let fs = 13; fs >= 7; fs--) {
    ctx.font = `600 ${fs}px Lato, sans-serif`;
    const totalH = [...title].reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) * 1.05;
    if (totalH <= avail) return { fs, h: baseH };
  }
  // 7px doesn't fit — extend spine height to accommodate
  ctx.font = '600 7px Lato, sans-serif';
  const totalH7 = [...title].reduce((sum, ch) => sum + ctx.measureText(ch).width, 0) * 1.05;
  return { fs: 7, h: Math.ceil(totalH7) + 22 };
}

/* ── shelf / stacks rendering ── */
function spineEl(s, idx) {
  const wc = s.wc || 100;
  const w = Math.max(30, Math.round(20 + Math.sqrt(wc) * 0.5));
  const baseH = 150 + (idx % 3) * 8;
  const { fs, h } = fitSpineText(s.t, baseH);
  const bg = FC[s.f] || 'var(--accent)';
  const fg = SPINE_TEXT_COLOR[bg] || 'var(--call-label-bg)';
  const prefix = s.dewey || 'FIC';
  return `<button class="spine" data-id="${s.id}" style="width:${w}px;height:${h}px;background:${bg}" title="${esc(s.t)}"><span class="spine-title" style="font-size:${fs}px;color:${fg}">${esc(s.t)}</span><span class="call-num-tag">${esc(prefix)}<br>KHA<br>${esc(s.w||'—')}</span></button>`;
}

function renderShelfView(r) {
  const out = $('out');
  const byRoom = { fiction: {}, nonfiction: {} };
  for (const s of r) { const rm = s.room || 'fiction'; const sh = s.shelf || 'Other'; (byRoom[rm][sh] ??= []).push(s); }
  const cur = byRoom[room];
  const rt = `<div class="room-toggle"><button aria-pressed="${room === 'fiction'}" data-room="fiction">Fiction room</button><button aria-pressed="${room === 'nonfiction'}" data-room="nonfiction">Nonfiction room</button></div>`;
  let idx = 0;
  const html = Object.entries(cur).sort((a, b) => a[0].localeCompare(b[0])).map(([name, sp]) => {
    const count = sp.length;
    const words = sp.reduce((s, x) => s + (x.wc || 0), 0);
    const stat = count + (count === 1 ? ' story' : ' stories') + (words ? ' · ' + words.toLocaleString() + ' words' : '');
    const spines = sp.map(s => spineEl(s, idx++)).join('');
    return `<div class="shelf-section"><div class="shelf-hd"><span class="shelf-name">${esc(name)}</span><span class="shelf-stat">${esc(stat)}</span></div><div class="shelf-row">${spines}</div><div class="shelf-plank"></div></div>`;
  }).join('');
  out.innerHTML = rt + (html || '<p class="empty">No stories in this room match the current filters.</p>');
  out.querySelectorAll('.room-toggle button').forEach(btn => { btn.onclick = () => { room = btn.dataset.room; renderShelfView(r); }; });
  out.querySelectorAll('.spine[data-id]').forEach(el => { el.onclick = () => openSpinePanel(stories.find(s => s.id === el.dataset.id)); });
}

const BOOK_PALETTE = ['var(--spine-short-story)','var(--spine-screenplay)','var(--spine-essay)','var(--spine-memoir)','var(--spine-rap)'];
function bookColor(b) {
  let h = 0; for (const c of (b.title + (b.authors||''))) h = (h*31 + c.charCodeAt(0)) % BOOK_PALETTE.length;
  return BOOK_PALETTE[Math.abs(h)];
}
function bookSpineEl(b) {
  const w = Math.max(30, Math.round(20 + (b.rating || 2.5) * 4));
  const bg = bookColor(b);
  const fg = SPINE_TEXT_COLOR[bg] || 'var(--call-label-bg)';
  const { fs, h } = fitSpineText(b.title, 180);
  return `<button class="spine" data-bid="${b.id}" style="width:${w}px;height:${h}px;background:${bg}" title="${esc(b.title)}"><span class="spine-title" style="font-size:${fs}px;color:${fg}">${esc(b.title)}</span>${b.rating ? `<span class="call-num-tag" style="color:${fg}">${'★'.repeat(Math.round(b.rating))}</span>` : ''}</button>`;
}

function renderBookSpines(r) {
  const out = $('out');
  const topRated = books.filter(b => b.rating >= 4).length;
  const summary = `<p class="books-summary"><strong>${books.length}</strong> books read · <strong>${topRated}</strong> rated 4★ or above</p>`;
  const byYear = {};
  for (const b of r) { const yr = b.yr || 'Other'; (byYear[yr] ??= []).push(b); }
  const shelves = Object.entries(byYear).sort((a, b) => b[0].localeCompare(a[0])).map(([yr, yb]) =>
    `<div class="shelf-section"><div class="shelf-name">${esc(yr)}</div><div class="shelf-row">${yb.map(bookSpineEl).join('')}</div><div class="shelf-plank"></div></div>`
  ).join('');
  out.innerHTML = summary + shelves;
  out.querySelectorAll('.spine[data-bid]').forEach(el => { el.onclick = () => openBookPanel(books.find(b => b.id === el.dataset.bid)); });
}

function ensurePanel() {
  let p = $('spine-panel');
  if (!p) { p = document.createElement('div'); p.id = 'spine-panel'; p.className = 'spine-panel'; p.setAttribute('hidden', ''); document.body.appendChild(p); }
  return p;
}

function openSpinePanel(s) {
  if (!s) return;
  const panel = ensurePanel();
  const prefix = s.dewey || 'FIC';
  const cb = `${prefix} KHA ${s.w || '—'}`;
  const genres = (s.g || []).filter(g => g !== s.f);
  const wcLine = s.wc ? esc(s.f || '') + ' · ' + s.wc.toLocaleString() + ' words · ~' + Math.round(s.wc/238) + ' min read' : esc(s.f || '');
  panel.innerHTML = `<button class="spine-panel-close" aria-label="Close">×</button><span class="call-badge">${esc(cb)}</span><h2>${esc(s.t)}</h2><p class="meta">${wcLine}</p>${s.aw ? `<p class="award-line">${esc(s.aw)}</p>` : ''}${genres.length ? `<p class="meta">${genres.map(g => `<span class="tag">${esc(g)}</span>`).join(' ')}</p>` : ''}<div class="spine-actions">${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">Read</a>` : ''}<a href="${esc('/train?board=' + s.id)}">Board here</a><button class="copy-link-btn" data-u="${esc(location.href.split('#')[0])}#${s.id}">Copy link</button></div>`;
  panel.removeAttribute('hidden');
  document.querySelectorAll('.spine.pulled').forEach(el => el.classList.remove('pulled'));
  const sp = document.querySelector(`.spine[data-id="${s.id}"]`); if (sp) sp.classList.add('pulled');
  panel.querySelector('.spine-panel-close').onclick = closeSpinePanel;
  panel.querySelector('.copy-link-btn').onclick = async e => { try { await navigator.clipboard.writeText(e.currentTarget.dataset.u); toast('Link copied — send it to someone'); } catch(err) { toast(e.currentTarget.dataset.u); } };
}

function openBookPanel(b) {
  if (!b) return;
  const panel = ensurePanel();
  panel.innerHTML = `<button class="spine-panel-close" aria-label="Close">×</button><h2>${esc(b.title)}</h2><p class="meta">${esc(b.authors)}</p>${b.rating ? `<p class="meta">${stars(b.rating)}</p>` : ''}${b.lastRead ? `<p class="meta">Read ${esc(b.lastRead.slice(0, 7))}</p>` : ''}`;
  panel.removeAttribute('hidden');
  document.querySelectorAll('.spine.pulled').forEach(el => el.classList.remove('pulled'));
  const sp = document.querySelector(`.spine[data-bid="${b.id}"]`); if (sp) sp.classList.add('pulled');
  panel.querySelector('.spine-panel-close').onclick = closeSpinePanel;
}

function closeSpinePanel() {
  const p = $('spine-panel'); if (p) p.setAttribute('hidden', '');
  document.querySelectorAll('.spine.pulled').forEach(el => el.classList.remove('pulled'));
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSpinePanel(); });
document.addEventListener('click', e => {
  const panel = $('spine-panel');
  if (panel && !panel.hidden && !panel.contains(e.target) && !e.target.closest('.spine')) closeSpinePanel();
});

/* ── database views ── */
let tab = 'writing', view = 'gallery', room = 'fiction';
try { view = localStorage.getItem('view') || 'gallery'; } catch (e) {}
const uniq = a => [...new Set(a.filter(Boolean))];
const opts = (el, label, vals) => { el.innerHTML = `<option value="">${label}</option>` + vals.map(v => `<option>${esc(v)}</option>`).join(''); };
function setupFilters() {
  const f1 = $('f1'), f2 = $('f2'); f2.hidden = false;
  if (tab === 'writing') { opts(f1, 'All years', uniq(posts.map(p => p.yr)).sort().reverse()); f2.hidden = true; }
  if (tab === 'stories') {
    opts(f1, 'All forms', uniq(stories.map(s => s.f)).sort());
    opts(f2, 'All genres', uniq(stories.flatMap(s => s.g)).sort());
    f2.insertAdjacentHTML('beforeend', '<option value="__fav">★ Personal favorites</option><option value="__aw">Award results</option>');
  }
  if (tab === 'projects') {
    opts(f1, 'All areas', uniq(projects.map(p => p.cat)).sort());
    opts(f2, 'All statuses', ['Ongoing', 'Completed']);
  }
  if (tab === 'tools') { opts(f1, 'All types', uniq(tools.map(t => t.ty))); opts(f2, 'All stages', uniq(tools.map(t => t.st))); }
  if (tab === 'bookshelf') {
    opts(f1, 'All years', uniq(books.map(b => b.yr)).filter(Boolean).sort().reverse());
    f2.hidden = true;
  }
}
function rows() {
  const q = $('q').value.trim().toLowerCase(), a = $('f1').value, b = $('f2').value;
  const m = x => !q || x.t.toLowerCase().includes(q);
  if (tab === 'writing') return posts.filter(p => m(p) && (!a || p.yr === a));
  if (tab === 'stories') return stories.filter(s => m(s) && (!a || s.f === a) && (!b || (b === '__fav' ? s.fav : b === '__aw' ? s.aw : s.g.includes(b))));
  if (tab === 'projects') {
    return projects.filter(p => {
      if (!(!q || p.t.toLowerCase().includes(q))) return false;
      if (a && p.cat !== a) return false;
      if (b === 'Ongoing' && !p.ongoing) return false;
      if (b === 'Completed' && p.ongoing) return false;
      return true;
    });
  }
  if (tab === 'bookshelf') {
    return books.filter(bk => {
      if (q && !bk.title.toLowerCase().includes(q) && !bk.authors.toLowerCase().includes(q)) return false;
      if (a && bk.yr !== a) return false;
      return true;
    });
  }
  return tools.filter(t => m(t) && (!a || t.ty === a) && (!b || t.st === b));
}
const shareBtn = (id, url) => `<button class="sh" data-u="${esc(url || '')}" data-id="${id}">Copy link</button>`;
const link = (url, inner) => url ? `<a href="${esc(url)}">${inner}</a>` : inner;
function render() {
  const r = rows(), out = $('out');
  $('count').textContent = r.length + (r.length === 1 ? ' item' : ' items');
  if (!r.length) { out.innerHTML = '<p class="empty">Nothing matches. Clear the search or filters.</p>'; return; }

  if (tab === 'bookshelf') { renderBookSpines(r); return; }
  if (tab === 'stories' && view === 'shelf') { renderShelfView(r); return; }

  if (view === 'table') {
    if (tab === 'writing') out.innerHTML = `<table class="stack"><thead><tr><th>Title</th><th>Published</th><th></th></tr></thead><tbody>${r.map(p => `<tr id="${p.id}"><td class="ttl">${link(p.url, esc(p.t))}</td><td class="wk">${fmtD(p.d)}</td><td>${shareBtn(p.id, p.url)}</td></tr>`).join('')}</tbody></table>`;
    if (tab === 'stories') out.innerHTML = `<table class="stack"><thead><tr><th>Week</th><th>Title</th><th>Form</th><th>Genre</th><th></th></tr></thead><tbody>${r.map(s => `<tr id="${s.id}"><td class="wk">${esc(s.w)}</td><td class="ttl">${s.fav ? '<span class="star" title="Personal favorite">★</span> ' : ''}${link(s.url, esc(s.t))}${s.aw ? `<span class="award">${esc(s.aw)}</span>` : ''}</td><td>${tag(s.f)}</td><td>${s.g.filter(g => g !== s.f).map(tag).join('')}</td><td>${shareBtn(s.id, s.url)}</td></tr>`).join('')}</tbody></table>`;
    if (tab === 'projects') out.innerHTML = `<table class="stack"><thead><tr><th>Project</th><th>When</th><th>Area</th><th>Links</th><th></th></tr></thead><tbody>${r.map(p => `<tr id="${p.id}"><td class="ttl">${esc(p.t)}<span class="award" style="color:var(--muted)">${esc(p.one)}</span></td><td class="wk">${span(p)}</td><td>${tag(p.cat)}</td><td>${p.links.map(([l, u]) => `<a href="${esc(u)}">${esc(l)}</a>`).join('<br>')}</td><td>${shareBtn(p.id)}</td></tr>`).join('')}</tbody></table>`;
    if (tab === 'tools') out.innerHTML = `<table class="stack"><thead><tr><th>Name</th><th>Type</th><th>Stage</th><th></th></tr></thead><tbody>${r.map(t => `<tr id="${t.id}"><td class="ttl">${link(t.url, esc(t.t))}${t.one ? `<span class="award" style="color:var(--muted)">${esc(t.one)}</span>` : ''}</td><td>${tag(t.ty)}</td><td>${tag(t.st)}</td><td>${shareBtn(t.id, t.url)}</td></tr>`).join('')}</tbody></table>`;
    return;
  }

  out.innerHTML = '<div class="grid">' + r.map(x => {
    if (tab === 'writing') return `<article class="card" id="${x.id}">${link(x.url, thumb(x, ''))}<span class="wk">${fmtD(x.d)}</span><h3>${link(x.url, esc(x.t))}</h3><div class="foot">${link(x.url, 'Read')}${shareBtn(x.id, x.url)}</div></article>`;
    if (tab === 'stories') return `<article class="card" id="${x.id}">${link(x.url, thumb(x, x.w))}<span class="wk">Week ${esc(x.w)}${x.fav ? ' <span class="star">★</span>' : ''}</span><h3>${link(x.url, esc(x.t))}</h3>${x.aw ? `<span class="award">${esc(x.aw)}</span>` : ''}<div>${tag(x.f)}${x.g.filter(g => g !== x.f).map(tag).join('')}</div><div class="foot">${link(x.url, 'Read')}${shareBtn(x.id, x.url)}</div></article>`;
    if (tab === 'projects') return `<article class="card" id="${x.id}"><div class="th" style="--fc:${TINT(x.cat)}"><img loading="lazy" alt="" src="${esc(x.img)}" onerror="this.remove()"></div><span class="wk">${span(x)}</span><h3>${esc(x.t)}</h3><p style="margin:0;color:var(--muted)">${esc(x.one)}</p><div>${tag(x.cat)}</div><div class="foot"><span>${x.links.map(([l, u]) => `<a href="${esc(u)}">${esc(l)}</a>`).join(' · ')}</span>${shareBtn(x.id)}</div></article>`;
    return `<article class="card" id="${x.id}">${x.img ? `<div class="th" style="--fc:${TINT(x.t)}"><img loading="lazy" alt="" src="${esc(x.img)}" onerror="this.remove()"></div>` : ''}<h3>${link(x.url, esc(x.t))}</h3>${x.one ? `<p style="margin:0;color:var(--muted)">${esc(x.one)}</p>` : ''}<div>${tag(x.ty)}${tag(x.st)}</div><div class="foot"><span></span>${shareBtn(x.id, x.url)}</div></article>`;
  }).join('') + '</div>';
}
function go() {
  const h = decodeURIComponent(location.hash.slice(1)) || 'writing';
  const t = h.startsWith('s-') ? 'stories' : h.startsWith('p-') ? 'writing' : h.startsWith('t-') ? 'tools' : h.startsWith('x-') ? 'projects' : h.startsWith('b-') ? 'bookshelf' : ['writing', 'stories', 'tools', 'projects', 'bookshelf'].includes(h) ? h : 'writing';
  const tabChanged = t !== tab || !$('f1').options.length;
  if (tabChanged) {
    tab = t; $('q').value = ''; setupFilters();
    view = tab === 'stories' ? 'shelf' : view === 'shelf' ? 'gallery' : view;
    closeSpinePanel();
  }
  document.querySelectorAll('nav a').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + tab));
  const viewToggle = $('vg').closest('.seg');
  viewToggle.style.display = tab === 'bookshelf' ? 'none' : '';
  setView(view);
  if (h.includes('-')) { const el = document.getElementById(h); if (el) el.scrollIntoView({ block: 'center' }); }
}
function setView(v) { view = v; $('vg').setAttribute('aria-pressed', v === 'gallery'); $('vs').setAttribute('aria-pressed', v === 'shelf'); $('vt').setAttribute('aria-pressed', v === 'table'); try { localStorage.setItem('view', v); } catch (e) {} render(); }
let tt; function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1800); }
if ($('out')) {
  $('out').addEventListener('click', async e => {
    const b = e.target.closest('.sh'); if (!b) return;
    const url = b.dataset.u || location.href.split('#')[0] + '#' + b.dataset.id;
    try { await navigator.clipboard.writeText(url); toast('Link copied — send it to someone'); } catch (err) { toast(url); }
  });
  ['q', 'f1', 'f2'].forEach(id => $(id).addEventListener('input', render));
  $('vg').onclick = () => setView('gallery'); $('vs').onclick = () => setView('shelf'); $('vt').onclick = () => setView('table');
  window.addEventListener('hashchange', go);
  setView(view); go();
}
}
