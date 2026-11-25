/* Reading Nook — client interactivity */
(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────────
  const D = JSON.parse(document.getElementById('nook-data')?.textContent || '{}');
  const eligible = D.eligible || [];
  const initBook = D.initBook || null;

  // Track shown IDs this session (no repeats)
  const seen = new Set(initBook ? [initBook.id] : []);

  // ── Theme toggle ───────────────────────────────────────────────
  const themeBtn = document.getElementById('nook-theme');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const html = document.documentElement;
      const cur = html.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch {}
      themeBtn.setAttribute('aria-label', `Switch to ${cur} theme`);
    });
    // Sync icon visibility
    function syncThemeIcon() {
      const cur = document.documentElement.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const sun = document.getElementById('nk-sun');
      const moon = document.getElementById('nk-moon');
      if (sun) sun.style.display = cur === 'dark' ? 'block' : 'none';
      if (moon) moon.style.display = cur === 'dark' ? 'none' : 'block';
    }
    syncThemeIcon();
  }

  // ── Toast ──────────────────────────────────────────────────────
  let toastTimer;
  function showToast(msg) {
    const t = document.getElementById('nook-toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('on'), 2600);
  }

  // ── Copy link ─────────────────────────────────────────────────
  document.getElementById('copy-link')?.addEventListener('click', () => {
    const url = document.getElementById('keep-reading')?.href || location.href;
    navigator.clipboard?.writeText(url)
      .then(() => showToast('Link copied'))
      .catch(() => {
        try {
          const ta = document.createElement('textarea');
          ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta);
          showToast('Link copied');
        } catch { showToast('Could not copy'); }
      });
  });

  // ── Render a book into the article ────────────────────────────
  function renderBook(book) {
    const article = document.getElementById('nook-book');
    if (!article) return;

    const wc = book.wc ? Number(book.wc).toLocaleString() : '';
    article.innerHTML = `
      <p class="nook-call-line" id="book-call">
        <span class="nook-call-badge">${esc(book.call || 'FIC')}</span>
        <span class="nook-call-sep">·</span>
        <span class="nook-call-format">${esc(book.f || '')}</span>
        ${wc ? `<span class="nook-call-sep">·</span><span class="nook-call-wc">${esc(wc)} words</span>` : ''}
      </p>
      <h1 class="nook-title" id="book-title">${esc(book.t)}</h1>
      <div class="nook-excerpt" id="book-excerpt">
        <p>${book.excerpt ? esc(book.excerpt) : 'No preview available for this piece.'}</p>
      </div>
      <div class="nook-actions">
        <a class="nook-btn-read" id="keep-reading" href="${esc(book.url || '#')}" target="_blank" rel="noopener noreferrer">Keep reading</a>
        <button class="nook-btn-sec" id="pull-book">Pull another book</button>
        <button class="nook-btn-ghost" id="copy-link">Copy link</button>
      </div>
    `;
    // Re-attach listeners after re-render
    bindActions();
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ── Pull another book ─────────────────────────────────────────
  async function pullBook() {
    const article = document.getElementById('nook-book');
    if (!article) return;

    // Filter eligible client-side first (fast path, no excerpt)
    const pool = eligible.filter(s => !seen.has(s.id));
    if (!pool.length) {
      // Reset session and try again
      seen.clear();
      if (initBook) seen.add(initBook.id);
      const pool2 = eligible.filter(s => !seen.has(s.id));
      if (!pool2.length) { showToast('You have read the whole shelf!'); return; }
    }

    article.classList.add('loading');

    const excludeParam = [...seen].join(',');
    try {
      const res = await fetch(`/api/nook-book?exclude=${encodeURIComponent(excludeParam)}`);
      if (!res.ok) {
        if (res.status === 404) {
          seen.clear();
          showToast('Starting the shelf over…');
          article.classList.remove('loading');
          return;
        }
        throw new Error('fetch failed');
      }
      const book = await res.json();
      seen.add(book.id);
      renderBook(book);
      article.classList.remove('loading');
      // Scroll the reading column back up
      const col = article.closest('.nook-read-col');
      if (col) col.scrollTop = 0;
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      article.classList.remove('loading');
      showToast('Could not reach the shelf. Try again.');
    }
  }

  // ── Bind action buttons (call after re-render) ────────────────
  function bindActions() {
    document.getElementById('pull-book')?.addEventListener('click', pullBook);
    document.getElementById('copy-link')?.addEventListener('click', () => {
      const url = document.getElementById('keep-reading')?.href || location.href;
      navigator.clipboard?.writeText(url)
        .then(() => showToast('Link copied'))
        .catch(() => showToast('Could not copy'));
    });
  }

  bindActions();
})();
