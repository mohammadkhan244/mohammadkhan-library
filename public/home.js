/* home.js — front door interactivity */

(function () {
  'use strict';

  /* ── Theme toggle ─────────────────────────────────────────── */
  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var html = document.documentElement;
      var cur = html.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (_) {}
      toggle.setAttribute('aria-label',
        'Switch to ' + (next === 'dark' ? 'light' : 'dark') + ' theme');
    });
  }

  /* ── Rotating H1 phrase ───────────────────────────────────── */
  var phraseEl = document.getElementById('h1-phrase');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (phraseEl && !reduced) {
    var phrases = ['build things', 'write stories', 'design thinking tools'];
    var pIdx = 0;
    setInterval(function () {
      pIdx = (pIdx + 1) % phrases.length;
      phraseEl.style.opacity = '0';
      setTimeout(function () {
        phraseEl.textContent = phrases[pIdx];
        phraseEl.style.opacity = '1';
      }, 200);
    }, 4000);
  }

  /* ── Question cycling ─────────────────────────────────────── */
  var dataEl = document.getElementById('questions-data');
  var qEl = document.getElementById('question-text');
  var nextBtn = document.getElementById('next-question');
  if (dataEl && qEl && nextBtn) {
    var questions;
    try { questions = JSON.parse(dataEl.textContent); } catch (_) { return; }
    if (!questions || !questions.length) return;

    /* sync starting index to the server-rendered text */
    var init = qEl.textContent.trim();
    var qIdx = questions.indexOf(init);
    if (qIdx < 0) qIdx = 0;

    nextBtn.addEventListener('click', function () {
      qIdx = (qIdx + 1) % questions.length;
      qEl.textContent = questions[qIdx];
    });
  }
})();
