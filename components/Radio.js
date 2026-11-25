// Shared radio UI shell — no client JS; all interactivity lives in public/radio.js
// The radio-id prop lets multiple instances coexist on the same page.
//
// Playlist IDs are embedded in data-pl attributes so radio.js can read them
// without duplicating the strings.

export default function Radio({ radioId = 'nook-radio', className = '' }) {
  const p = radioId; // prefix helper

  return (
    <div
      className={`radio-wrap${className ? ` ${className}` : ''}`}
      id={p}
      data-radio={p}
    >
      {/* ── Player area: revealed when a source is active ───────────
          YouTube ToS requires the player iframe to stay visible (≥200×200)
          while playing. The player-area becomes visible when any source
          starts; each slot hosts one YT.Player instance. */}
      <div className="radio-player-area" id={`${p}-player-area`} hidden>
        <div className="radio-player-slot" id={`${p}-p-ambience`} hidden aria-label="Ambience player" />
        <div className="radio-player-slot" id={`${p}-p-music`} hidden aria-label="Music player" />
      </div>

      {/* ── Slim bar: always visible ──────────────────────────────── */}
      <div className="radio-bar">
        <button
          className="radio-bar-toggle"
          id={`${p}-toggle`}
          aria-controls={`${p}-controls`}
          aria-expanded="false"
          aria-label="Expand radio controls"
        >
          <svg className="radio-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M11.536 1.5a.5.5 0 0 1 .707 0l2.121 2.121a.5.5 0 0 1 0 .707L4.95 13.743a.5.5 0 0 1-.353.147H2.5a.5.5 0 0 1-.5-.5v-2.096a.5.5 0 0 1 .146-.354L11.536 1.5zM2 11.75V13h1.25l9.49-9.49-1.25-1.25L2 11.75z"/>
          </svg>
          <span className="radio-bar-label" id={`${p}-bar-label`}>Rain &amp; music</span>
        </button>
        <span className="radio-bar-now" id={`${p}-bar-now`} aria-live="polite" />
        <button
          className="radio-bar-skip"
          id={`${p}-bar-skip`}
          aria-label="Skip track"
          hidden
        >⏭</button>
        <span className="radio-bar-caret" id={`${p}-caret`} aria-hidden="true">›</span>
      </div>

      {/* ── Full controls panel ───────────────────────────────────── */}
      <div className="radio-controls" id={`${p}-controls`} hidden>

        {/* Ambience section */}
        <div className="radio-section">
          <div className="radio-row">
            <span className="radio-lbl">Ambience</span>
            <div className="radio-seg" role="group" aria-label="Ambience">
              <button
                className="radio-seg-btn"
                id={`${p}-amb-off`}
                aria-pressed="true"
              >Off</button>
              <button
                className="radio-seg-btn"
                id={`${p}-amb-on`}
                aria-pressed="false"
              >On</button>
            </div>
            <button
              className="radio-skip-btn"
              id={`${p}-amb-skip`}
              aria-label="Skip ambience track"
              hidden
            >Skip ⏭</button>
          </div>
          <p className="radio-track-name" id={`${p}-amb-track`} aria-live="polite" />
          <div className="radio-vol-row" id={`${p}-amb-vol-row`} hidden>
            <label className="radio-vol-lbl" htmlFor={`${p}-amb-vol`}>Vol</label>
            <input
              type="range"
              id={`${p}-amb-vol`}
              className="radio-vol"
              min="0"
              max="100"
              defaultValue="50"
              aria-label="Ambience volume"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="radio-divider" />

        {/* Music section */}
        <div className="radio-section">
          <div className="radio-row">
            <span className="radio-lbl">Music</span>
          </div>
          <div className="radio-cars" role="group" aria-label="Music carriage">
            <button
              className="radio-car-btn"
              id={`${p}-car-quiet`}
              aria-pressed="false"
              data-pl="PLgW2QBwvZrLzHpJJyr41pvU9dO4OmF9HI"
            >Quiet</button>
            <button
              className="radio-car-btn"
              id={`${p}-car-lounge`}
              aria-pressed="false"
              data-pl="PLgW2QBwvZrLxQvJnKZOmMPG2Hv0Rb6Ga9"
            >Lounge</button>
            <button
              className="radio-car-btn"
              id={`${p}-car-club`}
              aria-pressed="false"
              data-pl="PLgW2QBwvZrLyunU41ILmkqjm9v9Lqcy1E"
            >Club</button>
            <button
              className="radio-car-btn"
              id={`${p}-car-freestyle`}
              aria-pressed="false"
              data-pl="PLgW2QBwvZrLy_cfnWaoXMv8MesDzmw6PM"
            >Freestyle</button>
          </div>
          <div className="radio-vol-row" id={`${p}-music-vol-row`} hidden>
            <label className="radio-vol-lbl" htmlFor={`${p}-music-vol`}>Vol</label>
            <input
              type="range"
              id={`${p}-music-vol`}
              className="radio-vol"
              min="0"
              max="100"
              defaultValue="35"
              aria-label="Music volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
