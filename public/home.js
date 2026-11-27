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
  var accentEl = phraseEl ? phraseEl.querySelector('.fd-phrase-accent') : null;
  var restEl   = phraseEl ? phraseEl.querySelector('.fd-phrase-rest')   : null;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (phraseEl && accentEl && restEl && !reduced) {
    var phrases = [
      { accent: 'write stories',     rest: ' to see where an idea leads.' },
      { accent: 'build tools',       rest: ' to see problems differently.' },
      { accent: 'take things apart', rest: ' to understand how they work.' },
    ];
    var pIdx = 0;
    setInterval(function () {
      pIdx = (pIdx + 1) % phrases.length;
      phraseEl.style.opacity = '0';
      setTimeout(function () {
        var p = phrases[pIdx];
        accentEl.textContent = p.accent;
        restEl.textContent = p.rest;
        phraseEl.style.opacity = '1';
      }, 200);
    }, 4000);
  }

  /* ── Explore shuffle ─────────────────────────────────────── */
  var expWrap = document.querySelector('.fd-exp-panels');
  var expShuffle = document.getElementById('exp-shuffle');
  if (expWrap && expShuffle) {
    var expPanels = Array.from(expWrap.children);
    var expReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var expIdx = expPanels.findIndex(function (p) { return !p.hasAttribute('aria-hidden'); });
    if (expIdx < 0) expIdx = 0;

    function activatePanel(idx) {
      expPanels.forEach(function (p, i) {
        if (i === idx) p.removeAttribute('aria-hidden');
        else p.setAttribute('aria-hidden', 'true');
      });
      var h = expPanels[idx] && expPanels[idx].querySelector('.fd-exp-thread');
      if (h) h.focus();
    }

    expShuffle.addEventListener('click', function () {
      var next = (expIdx + 1) % expPanels.length;
      if (expReduced) {
        expIdx = next;
        activatePanel(expIdx);
      } else {
        var cur = expPanels[expIdx];
        cur.style.opacity = '0';
        setTimeout(function () {
          cur.style.opacity = '';
          expIdx = next;
          activatePanel(expIdx);
        }, 200);
      }
    });
  }

  /* ── Question cycling ─────────────────────────────────────── */
  var dataEl = document.getElementById('questions-data');
  var qEl = document.getElementById('question-text');
  var qLink = document.getElementById('q-link');
  var nextBtn = document.getElementById('next-question');
  if (dataEl && qEl && nextBtn) {
    var questions;
    try { questions = JSON.parse(dataEl.textContent); } catch (_) { return; }
    if (!questions || !questions.length) return;

    /* sync starting index to the server-rendered day-of-year mod n */
    var now = new Date();
    var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
    var qIdx = dayOfYear % questions.length;

    nextBtn.addEventListener('click', function () {
      qIdx = (qIdx + 1) % questions.length;
      var q = questions[qIdx];
      qEl.textContent = q.text;
      if (qLink) { qLink.href = q.href; qLink.textContent = q.linkText + ' →'; }
    });
  }
})();
