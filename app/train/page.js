import Script from 'next/script';
import { getLibrary } from '../../lib/notion';
import { classifyTowns, TOWNS } from '../../lib/towns';
import questions from '../../data/questions.json';

export const revalidate = 3600;

export const metadata = {
  title: 'Train of Thought · Mohammad Khan',
  description: 'A reading journey through subjects. Board a train, ride between towns, pick up pieces along the way.',
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export default async function TrainPage() {
  const data = await getLibrary();

  const townedStories = data.stories
    .filter(s => s.f && s.d)
    .map(s => {
      const towns = classifyTowns(s);
      const readMin = s.wc ? Math.round(s.wc / 238) : null;
      return {
        id: 's-' + (s.w || s.t.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()),
        t: s.t, w: s.w, f: s.f, wc: s.wc || 0, d: s.d,
        url: s.url, aw: s.aw || '', fav: s.fav || false, readMin,
        towns,
      };
    })
    .filter(s => s.towns.length > 0);

  const trainData = {
    stories: townedStories,
    towns: TOWNS,
    questions: Object.fromEntries(
      Object.entries(questions).filter(([k]) => !k.startsWith('_'))
    ),
  };
  const json = JSON.stringify(trainData).replace(/</g, '\\u003c');

  // Count stories per town for departures board fallback
  const townCounts = {};
  for (const s of townedStories) {
    for (const tid of s.towns) townCounts[tid] = (townCounts[tid] || 0) + 1;
  }

  return (
    <>
      <div className="train-chrome">
        <a className="train-home" href="/">
          <span className="train-name">Mohammad Khan</span>
          <span className="train-sub">Library</span>
        </a>
        <nav className="train-nav">
          <a href="/#stories">Stacks</a>
          <a href="/train" aria-current="page">Train of thought</a>
          <a href="/#tracker">Tracker</a>
          <a href="/#bookshelf">Bookshelf</a>
        </nav>
        <button id="train-theme" aria-label="Switch theme" className="train-theme-btn">
          <svg id="t-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg id="t-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
      </div>

      <div className="train-wrap" id="train-wrap">
        {/* ── Lobby ── */}
        <div className="train-lobby" id="train-lobby">
          <div className="depart-board" id="depart-board" aria-live="polite">
            <div className="depart-hd">
              <span className="depart-title">DEPARTURES</span>
              <span className="depart-sub">Board a piece to start your ride</span>
            </div>
            <div className="depart-rows" id="depart-rows">
              {/* populated by train.js */}
            </div>
          </div>
          <div className="lobby-actions">
            <button className="btn-primary" id="board-random">Board a random train →</button>
          </div>
          <div className="town-index" id="town-index">
            {TOWNS.map(t => (
              <button key={t.id} className="town-chip" data-town={t.id} aria-label={`${t.name}: ${townCounts[t.id] || 0} pieces`}>
                <span className="tc-name">{t.name}</span>
                <span className="tc-count">{townCounts[t.id] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Ride ── */}
        <div className="train-ride" id="train-ride" hidden>
          <div className="route-bar" id="route-bar">
            {/* route towns — populated by train.js */}
          </div>
          <div className="ride-body">
            <div className="ride-center">
              <div className="current-stop-wrap" id="current-stop-wrap">
                <div className="stop-label">Current stop</div>
                <div className="current-stop" id="current-stop" />
              </div>
              <div className="window-section">
                <div className="window-label">Out the window</div>
                <div className="window-row" id="window-row" />
              </div>
            </div>
            <div className="carriage" id="carriage">
              <div className="carriage-hd">
                <span>Carriage</span>
                <button className="carriage-close" id="carriage-close" aria-label="Collapse carriage">‹</button>
              </div>
              <div className="carriage-slots" id="carriage-slots">
                <p className="carriage-empty">Pick up pieces as you ride.</p>
              </div>
              <div className="combine-view" id="combine-view" hidden />
            </div>
          </div>
          <div className="ride-footer">
            <button className="btn-ghost" id="back-to-lobby">← Lobby</button>
            <button className="btn-ghost" id="show-carriage">Carriage <span id="carriage-count"></span></button>
          </div>
        </div>
      </div>

      <div className="toast" id="train-toast" role="status" />
      <script id="train-data" type="application/json" dangerouslySetInnerHTML={{ __html: json }} />
      <Script src="/train.js" strategy="afterInteractive" />
    </>
  );
}
