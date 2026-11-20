{
const D = JSON.parse(document.getElementById('data').textContent);
const FC = { 'Short Story': '#3a6ff7', Essay: '#e0569b', Poem: '#9aa0ad', Memoir: '#b5835a', Screenplay: '#8b5cf6', Rap: '#f08a24', StagePlay: '#d4a72c', Song: '#e5484d', Anthology: '#8a6b4e' };
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

const TINT = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return `light-dark(hsl(${h} 70% 93%),hsl(${h} 30% 22%))`; };
const tag = s => s ? `<span class="tag" style="--t:${TINT(s)}">${esc(s)}</span>` : '';
const thumb = (x, label, cls = '') => `<div class="th ${cls}" style="--fc:${FC[x.f] || TINT(x.t)}"><span>${esc(label)}</span>${x.img ? `<img loading="lazy" alt="" src="${esc(x.img)}" onerror="this.remove()">` : ''}</div>`;
const fmtD = d => new Date(d + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/* ── build tracker ── */
const made = [
  ...stories.map(s => ({ k: 'Story', d: s.d, t: (s.w ? 'Week ' + s.w + ': ' : '') + s.t, id: s.id, url: s.url })),
  ...posts.map(p => ({ k: 'Newsletter', d: p.d, t: p.t, id: p.id, url: p.url })),
  ...tools.map(t => ({ k: 'Product', d: t.d, t: t.t, id: t.id, url: t.url })),
  ...projects.map(p => ({ k: 'Project', d: p.d, t: p.t, id: p.id, url: '#' + p.id })),
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
  const lvl = n => !n ? '' : n >= 5 ? 'var(--acc)' : `color-mix(in srgb,var(--acc) ${[0, 30, 55, 80, 80][n]}%,var(--soft))`;
  $('grid').innerHTML = Y.map(y => `<div class="yr"><span>${y}</span><div class="cells">${Array.from({ length: 53 }, (_, w) => { const a = by[y + '-' + w] || []; return `<button data-c="${y}-${w}" aria-pressed="${selCell === y + '-' + w}" aria-label="${y} week ${w + 1}: ${a.length} made" title="${a.length ? a.length + ' made' : ''}" style="--c:${lvl(a.length)}"></button>`; }).join('')}</div><span>${yrs[y] || 0}</span></div>`).join('');
  const det = $('det'), a = by[selCell] || []; det.hidden = !selCell;
  if (selCell) {
    const [y, w] = selCell.split('-'); const j = new Date(+y, 0, 1 + w * 7);
    det.innerHTML = `<strong>Week of ${j.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>${a.length ? `<ul>${a.map(m => `<li><span class="k">${m.k}</span><a href="${esc(m.url || '#' + m.id)}">${esc(m.t)}</a></li>`).join('')}</ul>` : '<p style="margin:6px 0 0;color:var(--mute)">Nothing published this week.</p>'}`;
  }
}
$('grid').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; selCell = selCell === b.dataset.c ? '' : b.dataset.c; tracker(); });
$('chips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; kind = b.dataset.k; $('chips').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); selCell = ''; tracker(); });
tracker();

/* ── Tracker / Charts toggle ── */
function showTrackerView(which) {
  const tv = $('tracker-view'), cv = $('charts-view');
  const isCharts = which === 'charts';
  tv.hidden = isCharts;
  cv.hidden = !isCharts;
  $('tab-tracker').setAttribute('aria-pressed', !isCharts);
  $('tab-charts').setAttribute('aria-pressed', isCharts);
  if (isCharts && !cv.dataset.ready) { renderCharts(); cv.dataset.ready = '1'; }
}
document.querySelector('.trk-hd .seg').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  showTrackerView(b.id === 'tab-charts' ? 'charts' : 'tracker');
});

/* ── Charts ── */
function barChart(title, rows, fmtVal, takeaway) {
  if (!rows.length || rows.every(r => !r.val))
    return `<div class="chart"><h4>${esc(title)}</h4><p class="chart-empty">No data yet — available once word counts are synced from Notion.</p></div>`;
  const max = Math.max(...rows.map(r => r.val));
  const bars = rows.map(r => {
    const pct = max ? Math.round(r.val / max * 100) : 0;
    const col = FC[r.label] || 'var(--acc)';
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
  const topAvgYr = avgYrRows.reduce((best, r) => !best || r.val > best.val ? r : best, null);
  const c4 = barChart('Average story length per year', avgYrRows, n => loc(n) + ' wds',
    topAvgYr ? `Stories in ${topAvgYr.label} averaged ${loc(topAvgYr.val)} words, the longest average in any year.` : '');

  /* 5. stories by genre (top 10) */
  const byGenre = {};
  ss.forEach(s => s.g.forEach(g => { if (g && g !== s.f) byGenre[g] = (byGenre[g] || 0) + 1; }));
  const genreRows = Object.entries(byGenre).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, val]) => ({ label, val }));
  const topGenre = genreRows[0];
  const c5 = barChart('Stories by genre', genreRows, n => String(n),
    topGenre ? `${topGenre.label} is the most common genre, appearing in ${topGenre.val} stories.` : '');

  cv.innerHTML = `<div class="charts-grid">${c1}${c2}${c3}${c4}${c5}</div>`;
}

/* ── database views ── */
let tab = 'writing', view = 'gallery';
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
      const mt = !q || p.t.toLowerCase().includes(q);
      if (!mt) return false;
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

  if (tab === 'bookshelf') {
    out.innerHTML = '<div class="books-grid">' + r.map(bk =>
      `<article class="book-card" id="${bk.id}"><div class="book-info"><strong class="book-title">${esc(bk.title)}</strong><span class="book-auth">${esc(bk.authors)}</span>${bk.rating ? `<span class="book-stars">${stars(bk.rating)}</span>` : ''}</div>${bk.lastRead ? `<span class="book-date">${bk.lastRead.slice(0, 4)}</span>` : ''}</article>`
    ).join('') + '</div>';
    return;
  }

  if (view === 'table') {
    if (tab === 'writing') out.innerHTML = `<table class="stack"><thead><tr><th>Title</th><th>Published</th><th></th></tr></thead><tbody>${r.map(p => `<tr id="${p.id}"><td class="ttl">${link(p.url, esc(p.t))}</td><td class="wk">${fmtD(p.d)}</td><td>${shareBtn(p.id, p.url)}</td></tr>`).join('')}</tbody></table>`;
    if (tab === 'stories') out.innerHTML = `<table class="stack"><thead><tr><th>Week</th><th>Title</th><th>Form</th><th>Genre</th><th></th></tr></thead><tbody>${r.map(s => `<tr id="${s.id}"><td class="wk">${esc(s.w)}</td><td class="ttl">${s.fav ? '<span class="star" title="Personal favorite">★</span> ' : ''}${link(s.url, esc(s.t))}${s.aw ? `<span class="award">${esc(s.aw)}</span>` : ''}</td><td>${tag(s.f)}</td><td>${s.g.filter(g => g !== s.f).map(tag).join('')}</td><td>${shareBtn(s.id, s.url)}</td></tr>`).join('')}</tbody></table>`;
    if (tab === 'projects') out.innerHTML = `<table class="stack"><thead><tr><th>Project</th><th>When</th><th>Area</th><th>Links</th><th></th></tr></thead><tbody>${r.map(p => `<tr id="${p.id}"><td class="ttl">${esc(p.t)}<span class="award" style="color:var(--mute)">${esc(p.one)}</span></td><td class="wk">${span(p)}</td><td>${tag(p.cat)}</td><td>${p.links.map(([l, u]) => `<a href="${esc(u)}">${esc(l)}</a>`).join('<br>')}</td><td>${shareBtn(p.id)}</td></tr>`).join('')}</tbody></table>`;
    if (tab === 'tools') out.innerHTML = `<table class="stack"><thead><tr><th>Name</th><th>Type</th><th>Stage</th><th></th></tr></thead><tbody>${r.map(t => `<tr id="${t.id}"><td class="ttl">${link(t.url, esc(t.t))}${t.one ? `<span class="award" style="color:var(--mute)">${esc(t.one)}</span>` : ''}</td><td>${tag(t.ty)}</td><td>${tag(t.st)}</td><td>${shareBtn(t.id, t.url)}</td></tr>`).join('')}</tbody></table>`;
    return;
  }
  out.innerHTML = '<div class="grid">' + r.map(x => {
    if (tab === 'writing') return `<article class="card" id="${x.id}">${link(x.url, thumb(x, ''))}<span class="wk">${fmtD(x.d)}</span><h3>${link(x.url, esc(x.t))}</h3><div class="foot">${link(x.url, 'Read')}${shareBtn(x.id, x.url)}</div></article>`;
    if (tab === 'stories') return `<article class="card" id="${x.id}">${link(x.url, thumb(x, x.w))}<span class="wk">Week ${esc(x.w)}${x.fav ? ' <span class="star">★</span>' : ''}</span><h3>${link(x.url, esc(x.t))}</h3>${x.aw ? `<span class="award">${esc(x.aw)}</span>` : ''}<div>${tag(x.f)}${x.g.filter(g => g !== x.f).map(tag).join('')}</div><div class="foot">${link(x.url, 'Read')}${shareBtn(x.id, x.url)}</div></article>`;
    if (tab === 'projects') return `<article class="card" id="${x.id}"><div class="th" style="--fc:${TINT(x.cat)}"><img loading="lazy" alt="" src="${esc(x.img)}" onerror="this.remove()"></div><span class="wk">${span(x)}</span><h3>${esc(x.t)}</h3><p style="margin:0;color:var(--mute)">${esc(x.one)}</p><div>${tag(x.cat)}</div><div class="foot"><span>${x.links.map(([l, u]) => `<a href="${esc(u)}">${esc(l)}</a>`).join(' · ')}</span>${shareBtn(x.id)}</div></article>`;
    return `<article class="card" id="${x.id}"><h3>${link(x.url, esc(x.t))}</h3>${x.one ? `<p style="margin:0;color:var(--mute)">${esc(x.one)}</p>` : ''}<div>${tag(x.ty)}${tag(x.st)}</div><div class="foot"><span></span>${shareBtn(x.id, x.url)}</div></article>`;
  }).join('') + '</div>';
}
function go() {
  const h = decodeURIComponent(location.hash.slice(1)) || 'writing';
  const t = h.startsWith('s-') ? 'stories' : h.startsWith('p-') ? 'writing' : h.startsWith('t-') ? 'tools' : h.startsWith('x-') ? 'projects' : h.startsWith('b-') ? 'bookshelf' : ['writing', 'stories', 'tools', 'projects', 'bookshelf'].includes(h) ? h : 'writing';
  if (t !== tab || !$('f1').options.length) { tab = t; $('q').value = ''; setupFilters(); }
  document.querySelectorAll('nav a').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + tab));
  const viewToggle = $('vg').closest('.seg');
  viewToggle.style.display = tab === 'bookshelf' ? 'none' : '';
  render();
  if (h.includes('-')) { const el = document.getElementById(h); if (el) el.scrollIntoView({ block: 'center' }); }
}
function setView(v) { view = v; $('vt').setAttribute('aria-pressed', v === 'table'); $('vg').setAttribute('aria-pressed', v === 'gallery'); try { localStorage.setItem('view', v); } catch (e) {} render(); }
let tt; function toast(m) { const t = $('toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 1800); }
$('out').addEventListener('click', async e => {
  const b = e.target.closest('.sh'); if (!b) return;
  const url = b.dataset.u || location.href.split('#')[0] + '#' + b.dataset.id;
  try { await navigator.clipboard.writeText(url); toast('Link copied — send it to someone'); } catch (err) { toast(url); }
});
['q', 'f1', 'f2'].forEach(id => $(id).addEventListener('input', render));
$('vt').onclick = () => setView('table'); $('vg').onclick = () => setView('gallery');
window.addEventListener('hashchange', go);
setView(view); go();
}
