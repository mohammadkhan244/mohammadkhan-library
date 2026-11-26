{
const D = JSON.parse(document.getElementById('data').textContent);
const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const phone = () => window.innerWidth <= 640;

// ── Scale stage ──────────────────────────────────────────
const wrap  = document.getElementById('lab-wrap');
const stage = document.getElementById('lab-stage');

function scaleStage() {
  if (phone()) {
    stage.style.removeProperty('--lscale');
    wrap.style.removeProperty('--ls');
    return;
  }
  const scale = Math.min(1, window.innerWidth / 1280);
  stage.style.setProperty('--lscale', scale);
  wrap.style.setProperty('--ls', (800 * scale) + 'px');
}
scaleStage();
window.addEventListener('resize', scaleStage);

// ── Helpers ──────────────────────────────────────────────
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Replicates span() from app.js
const span = p => {
  const f = d => new Date(d.length > 7 ? d + 'T12:00' : d + '-15T12:00')
    .toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  return f(p.d) + (p.ongoing ? ' – Ongoing' : p.end ? ' – ' + f(p.end) : '');
};

// ── Tool SVG silhouettes (index 0–7) ────────────────────
const TOOL_SVGS = [
  // 0: wrench
  `<svg class="lab-tool-svg" viewBox="0 0 36 80" aria-hidden="true">
    <rect x="13" y="18" width="10" height="38" rx="3"/>
    <rect x="5" y="12" width="26" height="14" rx="6"/>
    <rect x="5" y="52" width="26" height="14" rx="6"/>
    <rect x="14" y="4" width="8" height="12" rx="4"/>
  </svg>`,
  // 1: hammer
  `<svg class="lab-tool-svg" viewBox="0 0 44 80" aria-hidden="true">
    <rect x="19" y="24" width="7" height="48" rx="3"/>
    <rect x="6" y="8" width="32" height="22" rx="5"/>
  </svg>`,
  // 2: screwdriver
  `<svg class="lab-tool-svg" viewBox="0 0 28 80" aria-hidden="true">
    <rect x="10" y="4" width="8" height="18" rx="4"/>
    <rect x="11" y="22" width="6" height="38" rx="2"/>
    <rect x="8" y="58" width="12" height="7" rx="1"/>
    <polygon points="8,65 20,65 20,74 8,74"/>
  </svg>`,
  // 3: ruler
  `<svg class="lab-tool-svg" viewBox="0 0 24 80" aria-hidden="true">
    <rect x="6" y="4" width="12" height="72" rx="3"/>
    <rect x="6" y="13" width="6" height="2.5"/>
    <rect x="6" y="21" width="9" height="2.5"/>
    <rect x="6" y="29" width="6" height="2.5"/>
    <rect x="6" y="37" width="9" height="2.5"/>
    <rect x="6" y="45" width="6" height="2.5"/>
    <rect x="6" y="53" width="9" height="2.5"/>
    <rect x="6" y="61" width="6" height="2.5"/>
  </svg>`,
  // 4: pencil
  `<svg class="lab-tool-svg" viewBox="0 0 28 80" aria-hidden="true">
    <rect x="10" y="6" width="8" height="14" rx="2"/>
    <rect x="11" y="20" width="6" height="40" rx="1"/>
    <polygon points="10,60 18,60 14,74"/>
  </svg>`,
  // 5: calipers
  `<svg class="lab-tool-svg" viewBox="0 0 48 80" aria-hidden="true">
    <rect x="21" y="6" width="6" height="52" rx="2"/>
    <rect x="6" y="6" width="36" height="8" rx="3"/>
    <rect x="6" y="54" width="14" height="5" rx="2"/>
    <rect x="28" y="54" width="14" height="5" rx="2"/>
    <rect x="6" y="54" width="6" height="20" rx="2"/>
    <rect x="36" y="54" width="6" height="20" rx="2"/>
    <circle cx="24" cy="36" r="8"/>
    <circle cx="24" cy="36" r="4" style="fill:var(--scene-arch-fill)"/>
  </svg>`,
  // 6: C-clamp
  `<svg class="lab-tool-svg" viewBox="0 0 48 80" aria-hidden="true">
    <rect x="8" y="8" width="30" height="9" rx="3"/>
    <rect x="8" y="62" width="30" height="9" rx="3"/>
    <rect x="8" y="8" width="10" height="63" rx="3"/>
    <rect x="22" y="22" width="6" height="34" rx="2"/>
    <rect x="28" y="34" width="12" height="6" rx="2"/>
    <circle cx="40" cy="37" r="6"/>
  </svg>`,
  // 7: key
  `<svg class="lab-tool-svg" viewBox="0 0 36 80" aria-hidden="true">
    <path d="M18 4C10.3 4 4 10.3 4 18s6.3 14 14 14 14-6.3 14-14S25.7 4 18 4zm0 6c4.4 0 8 3.6 8 8s-3.6 8-8 8-8-3.6-8-8 3.6-8 8-8z"/>
    <rect x="15" y="30" width="6" height="38" rx="2"/>
    <rect x="15" y="50" width="11" height="5" rx="2"/>
    <rect x="15" y="59" width="9" height="5" rx="2"/>
  </svg>`,
];

// ── Build pegboard tools ──────────────────────────────────
function buildTools() {
  const el = document.getElementById('lab-pegboard');
  if (!el) return;
  const tools = D.tools;
  if (!tools.length) return;
  const frag = document.createDocumentFragment();
  tools.forEach((tool, i) => {
    const el2 = tool.url ? document.createElement('a') : document.createElement('span');
    el2.className = 'lab-tool';
    if (tool.url) {
      el2.href = tool.url;
      el2.target = '_blank';
      el2.rel = 'noopener noreferrer';
    }
    el2.setAttribute('aria-label', tool.t);
    el2.innerHTML = TOOL_SVGS[i % TOOL_SVGS.length] +
      `<span class="lab-tool-name">${esc(tool.t)}</span>`;
    frag.appendChild(el2);
  });
  el.appendChild(frag);
}

// ── Build ongoing objects on bench ───────────────────────
function buildOngoing() {
  const el = document.getElementById('lab-ongoing');
  if (!el) return;
  const ongoing = D.projects.filter(p => p.ongoing);
  if (!ongoing.length) return;
  // Varying block heights for visual interest
  const HEIGHTS = [52, 44, 60, 40, 56, 48];
  const frag = document.createDocumentFragment();
  ongoing.forEach((p, i) => {
    const obj = document.createElement('div');
    obj.className = 'lab-ong-obj';
    const h = HEIGHTS[i % HEIGHTS.length];
    obj.innerHTML =
      `<div class="lab-ong-dot" aria-hidden="true"></div>` +
      `<div class="lab-ong-block" style="height:${h}px" aria-hidden="true"></div>` +
      `<div class="lab-ong-label">${esc(p.t)}</div>`;
    frag.appendChild(obj);
  });
  el.appendChild(frag);
}

// ── Category ordering ────────────────────────────────────
const CATS = ['Software','Engineering','Humanitarian','Consulting','Filmmaking','Writing','STEM Teaching'];

// ── Build drawers ────────────────────────────────────────
function buildDrawers() {
  const el = document.getElementById('lab-cabinet');
  if (!el) return;
  const frag = document.createDocumentFragment();
  CATS.forEach(cat => {
    const projects = D.projects.filter(p => p.cat === cat);
    if (!projects.length) return;
    const btn = document.createElement('button');
    btn.className = 'lab-drawer';
    btn.dataset.cat = cat;
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      `<span class="lab-drawer-label">${esc(cat)}</span>` +
      `<span class="lab-drawer-count">${projects.length}</span>`;
    btn.addEventListener('click', () => toggleDrawer(cat, btn));
    frag.appendChild(btn);
  });
  el.appendChild(frag);
}

// ── Panel management ─────────────────────────────────────
let openCat = null;

function toggleDrawer(cat, btn) {
  if (openCat === cat) { closePanel(); return; }
  openCat = cat;

  // Update all drawer states
  document.querySelectorAll('.lab-drawer').forEach(d => {
    const isOpen = d.dataset.cat === cat;
    d.classList.toggle('lab-drawer--open', isOpen);
    d.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  if (phone()) {
    openPhonePanel(cat, btn);
  } else {
    openDesktopPanel(cat);
  }
}

function projectCard(p) {
  const id = slug(p.t);
  const url = location.origin + '/lab#' + id;
  const linksHtml = (p.links || []).map(([label, href]) =>
    `<a href="${esc(href)}" target="_blank" rel="noopener" class="lab-proj-link">${esc(label)}</a>`
  ).join('');
  return (
    `<div class="lab-proj-card" id="${esc(id)}">` +
      `<div class="lab-proj-thumb">` +
        (p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" onerror="this.parentNode.style.display='none'">` : '') +
      `</div>` +
      `<div class="lab-proj-info">` +
        `<h3 class="lab-proj-name">${esc(p.t)}</h3>` +
        `<p class="lab-proj-dates">${esc(span(p))}</p>` +
        `<p class="lab-proj-one">${esc(p.one)}</p>` +
        `<div class="lab-proj-links">` +
          linksHtml +
          `<button class="lab-copy-btn" data-url="${esc(url)}">Copy link</button>` +
        `</div>` +
      `</div>` +
    `</div>`
  );
}

function wireCopyBtns(container) {
  container.querySelectorAll('.lab-copy-btn').forEach(btn => {
    btn.addEventListener('click', () => doCopy(btn.dataset.url));
  });
}

function openDesktopPanel(cat) {
  const panel = document.getElementById('lab-panel');
  const inner = document.getElementById('lab-panel-inner');
  const projects = D.projects.filter(p => p.cat === cat);
  inner.innerHTML =
    `<p class="lab-panel-cat">${esc(cat)}</p>` +
    `<div class="lab-panel-grid">${projects.map(projectCard).join('')}</div>`;
  wireCopyBtns(inner);
  panel.removeAttribute('hidden');
  panel.scrollTop = 0;
  document.getElementById('lab-panel-close').focus();
}

function openPhonePanel(cat, drawerBtn) {
  // Remove existing inline panel if any
  const existing = document.querySelector('.lab-inline-panel');
  if (existing) existing.remove();

  const projects = D.projects.filter(p => p.cat === cat);
  const panel = document.createElement('div');
  panel.className = 'lab-inline-panel';
  panel.innerHTML =
    `<div class="lab-panel-grid">${projects.map(projectCard).join('')}</div>`;
  wireCopyBtns(panel);

  // Insert below the drawer button
  drawerBtn.insertAdjacentElement('afterend', panel);
}

function closePanel() {
  openCat = null;

  const panel = document.getElementById('lab-panel');
  panel.setAttribute('hidden', '');

  const inline = document.querySelector('.lab-inline-panel');
  if (inline) inline.remove();

  document.querySelectorAll('.lab-drawer').forEach(d => {
    d.classList.remove('lab-drawer--open');
    d.setAttribute('aria-expanded', 'false');
  });
}

function doCopy(url) {
  navigator.clipboard.writeText(url).then(() => {
    const toast = document.getElementById('lab-toast');
    toast.textContent = 'Link copied';
    toast.classList.add('on');
    setTimeout(() => toast.classList.remove('on'), 2000);
  });
}

// ── Keyboard: Esc closes panel ───────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && openCat) closePanel();
});

// ── Close button ─────────────────────────────────────────
document.getElementById('lab-panel-close').addEventListener('click', closePanel);

// ── Init ─────────────────────────────────────────────────
buildTools();
buildOngoing();
buildDrawers();

// ── Hash deep-link: open correct drawer ──────────────────
function handleHash() {
  if (!location.hash) return;
  const id = location.hash.slice(1);
  const p = D.projects.find(pr => slug(pr.t) === id);
  if (!p) return;
  const btn = document.querySelector(`.lab-drawer[data-cat="${p.cat}"]`);
  if (btn) toggleDrawer(p.cat, btn);
}
handleHash();
window.addEventListener('hashchange', handleHash);
}
