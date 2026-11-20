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
const span = p => { const f = d => new Date(d.length > 7 ? d + 'T12:00' : d + '-15T12:00').toLocaleDateString(undefined, { month: 'short', year: 'numeric' }); return f(p.d) + (p.end ? ' – ' + f(p.end) : ''); };

const TINT = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return `light-dark(hsl(${h} 70% 93%),hsl(${h} 30% 22%))`; };
const tag = s => s ? `<span class="tag" style="--t:${TINT(s)}">${esc(s)}</span>` : '';
const thumb = (x, label, cls = '') => `<div class="th ${cls}" style="--fc:${FC[x.f] || TINT(x.t)}"><span>${esc(label)}</span>${x.img ? `<img loading="lazy" alt="" src="${esc(x.img)}" onerror="this.remove()">` : ''}</div>`;
const fmtD = d => new Date(d + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/* build tracker */
const made = [
  ...stories.map(s => ({ k: 'Story', d: s.d, t: (s.w ? 'Week ' + s.w + ': ' : '') + s.t, id: s.id, url: s.url })),
  ...posts.map(p => ({ k: 'Newsletter', d: p.d, t: p.t, id: p.id, url: p.url })),
  ...tools.map(t => ({ k: 'Product', d: t.d, t: t.t, id: t.id, url: t.url })),
  ...projects.map(p => ({ k: 'Project', d: p.d, t: p.t, id: p.id, url: '#' + p.id })),
];
const wk = d => { const x = new Date(d + 'T12:00'), j = new Date(x.getFullYear(), 0, 1, 12); return [x.getFullYear(), Math.min(52, Math.floor((x - j) / 864e5 / 7))]; };
const mon = d => { const x = new Date(d + 'T12:00'); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x.toISOString().slice(0, 10); };
let kind = '', sel = '';
function tracker() {
  const items = made.filter(m => !kind || m.k === kind), by = {}, yrs = {};
  for (const m of items) { const [y, w] = wk(m.d); (by[y + '-' + w] ??= []).push(m); yrs[y] = (yrs[y] || 0) + 1; }
  const ws = [...new Set(items.map(m => mon(m.d)))].sort(); let best = 0, run = 0, prev = 0;
  for (const w of ws) { const t = new Date(w).getTime(); run = prev && t - prev < 8 * 864e5 ? run + 1 : 1; best = Math.max(best, run); prev = t; }
  const now = new Date().getFullYear(), first = Math.min(now, ...items.map(m => +m.d.slice(0, 4))), Y = [];
  for (let y = now; y >= first; y--) Y.push(y);
  $('stats').innerHTML = `<div><b>${items.length}</b><span>things made</span></div><div><b>${ws.length}</b><span>weeks with something new</span></div><div><b>${best}</b><span>longest run of weeks in a row</span></div><div><b>${yrs[now] || 0}</b><span>made in ${now}</span></div>`;
  const lvl = n => !n ? '' : n >= 5 ? 'var(--acc)' : `color-mix(in srgb,var(--acc) ${[0, 30, 55, 80, 80][n]}%,var(--soft))`;
  $('grid').innerHTML = Y.map(y => `<div class="yr"><span>${y}</span><div class="cells">${Array.from({ length: 53 }, (_, w) => { const a = by[y + '-' + w] || []; return `<button data-c="${y}-${w}" aria-pressed="${sel === y + '-' + w}" aria-label="${y} week ${w + 1}: ${a.length} made" title="${a.length ? a.length + ' made' : ''}" style="--c:${lvl(a.length)}"></button>`; }).join('')}</div><span>${yrs[y] || 0}</span></div>`).join('');
  const det = $('det'), a = by[sel] || []; det.hidden = !sel;
  if (sel) {
    const [y, w] = sel.split('-'); const j = new Date(+y, 0, 1 + w * 7);
    det.innerHTML = `<strong>Week of ${j.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>${a.length ? `<ul>${a.map(m => `<li><span class="k">${m.k}</span><a href="${esc(m.url || '#' + m.id)}">${esc(m.t)}</a></li>`).join('')}</ul>` : '<p style="margin:6px 0 0;color:var(--mute)">Nothing published this week.</p>'}`;
  }
}
$('grid').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; sel = sel === b.dataset.c ? '' : b.dataset.c; tracker(); });
$('chips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; kind = b.dataset.k; $('chips').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b)); sel = ''; tracker(); });
tracker();

/* database views */
let tab = 'writing', view = 'gallery';
try { view = localStorage.getItem('view') || 'gallery'; } catch (e) {}
const uniq = a => [...new Set(a.filter(Boolean))];
const opts = (el, label, vals) => { el.innerHTML = `<option value="">${label}</option>` + vals.map(v => `<option>${esc(v)}</option>`).join(''); };
function setupFilters() {
  const f1 = $('f1'), f2 = $('f2'); f2.hidden = false;
  if (tab === 'writing') { opts(f1, 'All years', uniq(posts.map(p => p.yr))); f2.hidden = true; }
  if (tab === 'stories') {
    opts(f1, 'All forms', uniq(stories.map(s => s.f)).sort());
    opts(f2, 'All genres', uniq(stories.flatMap(s => s.g)).sort());
    f2.insertAdjacentHTML('beforeend', '<option value="__fav">★ Personal favorites</option><option value="__aw">Award results</option>');
  }
  if (tab === 'projects') { opts(f1, 'All areas', uniq(projects.map(p => p.cat)).sort()); f2.hidden = true; }
  if (tab === 'tools') { opts(f1, 'All types', uniq(tools.map(t => t.ty))); opts(f2, 'All stages', uniq(tools.map(t => t.st))); }
}
function rows() {
  const q = $('q').value.trim().toLowerCase(), a = $('f1').value, b = $('f2').value;
  const m = x => !q || x.t.toLowerCase().includes(q);
  if (tab === 'writing') return posts.filter(p => m(p) && (!a || p.yr === a));
  if (tab === 'stories') return stories.filter(s => m(s) && (!a || s.f === a) && (!b || (b === '__fav' ? s.fav : b === '__aw' ? s.aw : s.g.includes(b))));
  if (tab === 'projects') return projects.filter(p => m(p) && (!a || p.cat === a));
  return tools.filter(t => m(t) && (!a || t.ty === a) && (!b || t.st === b));
}
const shareBtn = (id, url) => `<button class="sh" data-u="${esc(url || '')}" data-id="${id}">Copy link</button>`;
const link = (url, inner) => url ? `<a href="${esc(url)}">${inner}</a>` : inner;
function render() {
  const r = rows(), out = $('out');
  $('count').textContent = r.length + (r.length === 1 ? ' item' : ' items');
  if (!r.length) { out.innerHTML = '<p class="empty">Nothing matches. Clear the search or filters.</p>'; return; }
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
  const t = h.startsWith('s-') ? 'stories' : h.startsWith('p-') ? 'writing' : h.startsWith('t-') ? 'tools' : h.startsWith('x-') ? 'projects' : ['writing', 'stories', 'tools', 'projects'].includes(h) ? h : 'writing';
  if (t !== tab || !$('f1').options.length) { tab = t; $('q').value = ''; setupFilters(); }
  document.querySelectorAll('nav a').forEach(a => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + tab));
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
