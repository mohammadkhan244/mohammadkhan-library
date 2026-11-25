/* Reading Nook radio — YouTube IFrame API (youtube-nocookie.com)
   Nothing loads from YouTube until the user picks a source.
   Call initRadio(radioId) from the page's own JS. */

(function () {
  'use strict';

  const AMBIENCE_PL = 'PLgW2QBwvZrLwMRPQjumPdscwwn0onFIog';
  const CARS = {
    quiet:     'PLgW2QBwvZrLzHpJJyr41pvU9dO4OmF9HI',
    lounge:    'PLgW2QBwvZrLxQvJnKZOmMPG2Hv0Rb6Ga9',
    club:      'PLgW2QBwvZrLyunU41ILmkqjm9v9Lqcy1E',
    freestyle: 'PLgW2QBwvZrLy_cfnWaoXMv8MesDzmw6PM',
  };

  // ── iOS: programmatic setVolume does nothing, and only one source at a time ──
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  // ── YouTube IFrame API loader (lazy, shared across all instances) ─────────
  let ytReady = false;
  const ytQueue = [];

  // onYouTubeIframeAPIReady must exist before the script tag is inserted
  window.onYouTubeIframeAPIReady = function () {
    ytReady = true;
    ytQueue.splice(0).forEach(fn => fn());
  };

  function whenYTReady(fn) {
    if (ytReady) { fn(); return; }
    ytQueue.push(fn);
    if (!document.getElementById('yt-iframe-api')) {
      const s = document.createElement('script');
      s.id = 'yt-iframe-api';
      s.src = 'https://www.youtube-nocookie.com/iframe_api';
      document.head.appendChild(s);
    }
  }

  // ── Build a YT.Player inside a container element ──────────────────────────
  function buildPlayer(containerEl, playlist, vol, onReadyCb, onStateCb) {
    const inner = document.createElement('div');
    containerEl.innerHTML = '';
    containerEl.appendChild(inner);

    return new YT.Player(inner, {
      width: '200',
      height: '200',
      playerVars: {
        listType:       'playlist',
        list:           playlist,
        autoplay:       1,
        loop:           1,
        controls:       0,
        disablekb:      1,
        fs:             0,
        rel:            0,
        modestbranding: 1,
        origin:         location.origin,
      },
      events: {
        onReady(e) {
          e.target.setVolume(vol);
          e.target.setShuffle(true);
          e.target.setLoop(true);
          onReadyCb && onReadyCb(e);
        },
        onStateChange(e) {
          onStateCb && onStateCb(e);
        },
        onError(e) {
          // Skip videos that can't be embedded (codes 100, 101, 150)
          if (e.data === 100 || e.data === 101 || e.data === 150) {
            try { e.target.nextVideo(); } catch {}
          }
        },
      },
    });
  }

  // ── initRadio: wire up one [data-radio] element ───────────────────────────
  function initRadio(radioId) {
    const root = document.getElementById(radioId);
    if (!root) return;

    const $ = suf => document.getElementById(radioId + suf);

    // State
    let ambiencePlayer = null;
    let musicPlayer    = null;

    const st = {
      ambienceOn: false,
      musicCar:   null,   // 'quiet' | 'lounge' | 'club' | 'freestyle' | null
      musicPl:    null,
      ambVol:     50,
      musicVol:   35,
      expanded:   false,
    };

    // Persist / restore
    const SK = 'radio-' + radioId;
    function persist() {
      try { localStorage.setItem(SK, JSON.stringify({ ambVol: st.ambVol, musicVol: st.musicVol, expanded: st.expanded })); } catch {}
    }
    (function restore() {
      try {
        const s = JSON.parse(localStorage.getItem(SK) || '{}');
        if (s.ambVol  != null) st.ambVol  = s.ambVol;
        if (s.musicVol != null) st.musicVol = s.musicVol;
        // Don't auto-start sources — user must click
      } catch {}
    })();

    // DOM helpers
    function showPlayers()  { const a = $('-player-area'); if (a) a.hidden = false; }
    function hidePlayers()  { if (!st.ambienceOn && !st.musicCar) { const a = $('-player-area'); if (a) a.hidden = true; } }

    // ── Rain animation (nook-specific; noop if element absent) ────
    function setRain(running) {
      const rain = document.getElementById('nook-rain');
      if (!rain) return;
      rain.querySelectorAll('.rs').forEach(el => {
        el.style.animationPlayState = running ? '' : 'paused';
        el.style.opacity = running ? '' : '0.15';
      });
    }

    // ── Bar label ─────────────────────────────────────────────────
    function updateBar() {
      const lbl  = $('-bar-label');
      const now  = $('-bar-now');
      const skip = $('-bar-skip');
      const car  = $('-caret');

      let labelText = 'Rain & music';
      let nowText   = '';
      let showSkip  = false;

      if (st.ambienceOn && st.musicCar) {
        labelText = `Ambience + ${cap(st.musicCar)}`;
        showSkip  = true;
      } else if (st.ambienceOn) {
        labelText = 'Ambience: On';
        showSkip  = true;
        try { nowText = ambiencePlayer?.getVideoData()?.title || ''; } catch {}
      } else if (st.musicCar) {
        labelText = `Music: ${cap(st.musicCar)}`;
      }

      if (lbl)  lbl.textContent  = labelText;
      if (now)  now.textContent  = nowText;
      if (skip) skip.hidden      = !showSkip;
      if (car)  car.textContent  = st.expanded ? '‹' : '›';
    }

    function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : ''; }

    // ── Ambience ──────────────────────────────────────────────────
    function updateAmbienceUI() {
      $('-amb-off')?.setAttribute('aria-pressed', String(!st.ambienceOn));
      $('-amb-on')?.setAttribute('aria-pressed',  String( st.ambienceOn));
      const skipEl = $('-amb-skip');
      const trackEl = $('-amb-track');
      const volRow  = $('-amb-vol-row');
      if (skipEl)  skipEl.hidden  = !st.ambienceOn;
      if (trackEl) trackEl.hidden = !st.ambienceOn;
      if (volRow && !isIOS) volRow.hidden = !st.ambienceOn;
      setRain(st.ambienceOn);
      updateBar();
    }

    function refreshTrack() {
      const el = $('-amb-track');
      if (!el || !ambiencePlayer) return;
      try { el.textContent = ambiencePlayer.getVideoData()?.title || ''; } catch {}
      updateBar();
    }

    function turnAmbienceOn() {
      if (isIOS && st.musicCar) {
        try { musicPlayer?.pauseVideo(); } catch {}
      }
      st.ambienceOn = true;

      const slot = $('-p-ambience');
      if (slot) { slot.hidden = false; showPlayers(); }

      if (!ambiencePlayer) {
        whenYTReady(() => {
          ambiencePlayer = buildPlayer(
            $('-p-ambience'), AMBIENCE_PL, st.ambVol,
            () => { refreshTrack(); setInterval(refreshTrack, 6000); },
          );
        });
      } else {
        try { ambiencePlayer.playVideo(); } catch {}
        refreshTrack();
      }

      updateAmbienceUI();
      persist();
    }

    function turnAmbienceOff() {
      st.ambienceOn = false;
      try { ambiencePlayer?.pauseVideo(); } catch {}
      if (!st.musicCar) { const s = $('-p-ambience'); if (s) s.hidden = true; hidePlayers(); }
      updateAmbienceUI();
      persist();
    }

    // ── Music ─────────────────────────────────────────────────────
    function updateMusicUI() {
      Object.keys(CARS).forEach(car => {
        $(`-car-${car}`)?.setAttribute('aria-pressed', String(car === st.musicCar));
      });
      const volRow = $('-music-vol-row');
      if (volRow && !isIOS) volRow.hidden = !st.musicCar;
      updateBar();
    }

    function switchCar(carName) {
      if (carName === st.musicCar) {
        // Toggle off
        st.musicCar = null; st.musicPl = null;
        try { musicPlayer?.pauseVideo(); } catch {}
        const s = $('-p-music');
        if (s) s.hidden = true;
        hidePlayers();
        updateMusicUI(); persist(); return;
      }

      if (isIOS && st.ambienceOn) {
        st.ambienceOn = false;
        try { ambiencePlayer?.pauseVideo(); } catch {}
        updateAmbienceUI();
      }

      st.musicCar = carName;
      st.musicPl  = CARS[carName];

      const slot = $('-p-music');
      if (slot) { slot.hidden = false; showPlayers(); }

      if (!musicPlayer) {
        whenYTReady(() => {
          musicPlayer = buildPlayer(
            $('-p-music'), st.musicPl, st.musicVol,
            () => { updateMusicUI(); },
          );
        });
      } else {
        try {
          musicPlayer.loadPlaylist({ listType: 'playlist', list: st.musicPl });
          musicPlayer.setShuffle(true);
          musicPlayer.setLoop(true);
          musicPlayer.setVolume(st.musicVol);
        } catch {}
      }

      updateMusicUI(); persist();
    }

    // ── Volume sliders ────────────────────────────────────────────
    function bindVol(inputSuffix, getV, setV) {
      const el = $(inputSuffix);
      if (!el) return;
      el.value = getV();
      el.addEventListener('input', () => { setV(+el.value); persist(); });
    }
    bindVol('-amb-vol',
      () => st.ambVol,
      v => { st.ambVol = v; try { ambiencePlayer?.setVolume(v); } catch {} }
    );
    bindVol('-music-vol',
      () => st.musicVol,
      v => { st.musicVol = v; try { musicPlayer?.setVolume(v); } catch {} }
    );

    // ── Expand / collapse ─────────────────────────────────────────
    function setExpanded(on) {
      st.expanded = on;
      const panel = $('-controls');
      const toggle = $('-toggle');
      if (panel)  panel.hidden = !on;
      if (toggle) toggle.setAttribute('aria-expanded', String(on));
      updateBar();
      persist();
    }

    // ── Event wiring ──────────────────────────────────────────────
    $('-toggle')?.addEventListener('click',    () => setExpanded(!st.expanded));
    $('-amb-off')?.addEventListener('click',   turnAmbienceOff);
    $('-amb-on')?.addEventListener('click',    turnAmbienceOn);
    $('-amb-skip')?.addEventListener('click',  () => { try { ambiencePlayer?.nextVideo(); } catch {} });
    $('-bar-skip')?.addEventListener('click',  () => { try { ambiencePlayer?.nextVideo(); } catch {} });

    Object.keys(CARS).forEach(car => {
      $(`-car-${car}`)?.addEventListener('click', () => switchCar(car));
    });

    // Hide volume sliders on iOS
    if (isIOS) {
      [$('-amb-vol-row'), $('-music-vol-row')].forEach(el => { if (el) el.hidden = true; });
    }

    // Initial render
    setExpanded(st.expanded);
    updateAmbienceUI();
    updateMusicUI();
  }

  // ── Auto-init any [data-radio] on the page ────────────────────────────────
  function autoInit() {
    document.querySelectorAll('[data-radio]').forEach(el => {
      initRadio(el.getAttribute('data-radio') || el.id);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  // Expose for manual init
  window.initRadio = initRadio;
})();
