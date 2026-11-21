import Script from 'next/script';
import { getLibrary } from '../../lib/notion';
import { classifyTowns, TOWNS } from '../../lib/towns';
import questions from '../../data/questions.json';

export const revalidate = 3600;

export async function generateMetadata({ searchParams }) {
  const sp = await searchParams;
  const r   = sp?.r || '';
  const s   = sp?.s || '';
  const c   = sp?.c || '';
  const car = sp?.car || '';
  // departure link: ?d=YYYY-MM-DD&t=HH:MM — treat as lobby (no ride OG)
  if (!r && sp?.d && sp?.t) {
    return {
      title: `Train of Thought · ${sp.t} departure · Mohammad Khan`,
      description: 'A reading journey through subjects. Board a train, ride between towns, pick up pieces along the way.',
      twitter: { card: 'summary_large_image' },
    };
  }

  const base = {
    description:
      'A reading journey through subjects. Board a train, ride between towns, pick up pieces along the way.',
    twitter: { card: 'summary_large_image' },
  };

  if (!r) {
    return {
      ...base,
      title: 'Train of Thought · Mohammad Khan',
      openGraph: {
        title: 'Train of Thought · Mohammad Khan',
        description: base.description,
        images: [{ url: '/og/ride', width: 1200, height: 630 }],
      },
    };
  }

  const towns = r.split(',').filter(Boolean);
  const firstName = TOWNS.find((t) => t.id === towns[0])?.name || towns[0] || 'Sci-Fi';
  const lastName  = TOWNS.find((t) => t.id === towns[towns.length - 1])?.name || towns[towns.length - 1] || 'Philosophy';
  const title = `A ride from ${firstName} to ${lastName} · Train of Thought`;
  const desc  = `A train journey through Mohammad Khan's writing, from ${firstName} to ${lastName}.`;

  const params = new URLSearchParams({ r });
  if (s)   params.set('s', s);
  if (c)   params.set('c', c);
  if (car) params.set('car', car);

  return {
    ...base,
    title,
    description: desc,
    openGraph: {
      title: `A ride from ${firstName} to ${lastName}`,
      description: desc,
      images: [{ url: `/og/ride?${params}`, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: `A ride from ${firstName} to ${lastName}` },
  };
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export default async function TrainPage() {
  const data = await getLibrary();

  const townedStories = data.stories
    .filter(s => s.f && s.d)
    .map(s => {
      const towns = classifyTowns(s);
      return {
        id: 's-' + (s.w || s.t.slice(0, 20).replace(/[^a-z0-9]/gi, '-').toLowerCase()),
        t: s.t, w: s.w, f: s.f, wc: s.wc || 0, d: s.d,
        url: s.url, aw: s.aw || '', fav: s.fav || false,
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

  return (
    <>
      {/* ── Chrome header ── */}
      <div className="train-chrome">
        <a className="train-home" href="/">
          <span className="train-name">Mohammad Khan</span>
          <span className="train-sub">Library</span>
        </a>
        <nav className="train-nav">
          <a href="/#stories">Stacks</a>
          <a href="/train" aria-current="page">Train</a>
          <a href="/#tracker">Tracker</a>
          <a href="/#bookshelf">Books</a>
        </nav>
        <button id="train-theme" aria-label="Switch theme" className="train-theme-btn">
          <svg id="t-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          <svg id="t-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
      </div>

      {/* ── Main content ── */}
      <div className="train-wrap" id="train-wrap">

        {/* ── Lobby ── */}
        <div className="train-lobby" id="train-lobby">
          <p className="lobby-intro">Pick a train. Each one takes you through my writing, stop by stop.</p>
          <div className="depart-board" id="depart-board" aria-live="polite">
            <div className="depart-hd">
              <span className="depart-title">DEPARTURES</span>
              <span className="depart-clock" id="depart-clock" aria-live="off">--:--</span>
            </div>
            <div className="depart-col-hd" aria-hidden="true">
              <span className="dc-time">TIME</span>
              <span className="dc-dest">DESTINATION</span>
              <span className="dc-line">LINE</span>
              <span className="dc-status">STATUS</span>
              <span></span>
            </div>
            <div className="depart-rows" id="depart-rows" />
          </div>
          <div id="depart-just-left" aria-live="polite" />
          <div className="depart-lobby-meta">
            <button id="depart-timetable-btn" className="btn-ghost">Today&apos;s timetable</button>
          </div>
          <div id="depart-timetable" hidden>
            <div id="depart-timetable-inner" />
          </div>
          <div className="lobby-actions">
            <button className="btn-primary" id="board-random">Board a random train →</button>
          </div>
        </div>

        {/* ── Ride ── */}
        <div className="train-ride" id="train-ride" hidden>
          <div className="route-strip-wrap">
            <p className="route-label" id="route-label">Your route</p>
            <div className="route-strip" id="route-bar" role="navigation" aria-label="Route stops" />
          </div>

          <div className="ride-layout">
            <div className="ride-main">
              <div id="current-stop" />
              <div id="out-window" />
              <div className="next-dep-wrap" id="next-dep-wrap">
                <p className="section-label">Next departures</p>
                <div className="next-departures" id="next-departures" />
              </div>
            </div>
            <aside className="carriage-panel" id="carriage-panel" aria-label="Your carriage" />
          </div>
        </div>
      </div>

      {/* ── Carriage bar (fixed bottom, above mobile tabs) ── */}
      <div className="carriage-bar" id="carriage-bar" hidden>
        <div className="cb-chips" id="cb-chips" />
        <button className="cb-combine" id="cb-combine" hidden>Combine →</button>
      </div>

      {/* ── Combine sheet ── */}
      <div className="combine-sheet" id="combine-sheet" hidden>
        <div className="combine-inner" id="combine-inner" />
      </div>

      {/* ── Mobile bottom tabs ── */}
      <nav className="train-tabs" aria-label="Sections">
        <a href="/#stories">Stacks</a>
        <a href="/train" aria-current="page">Train</a>
        <a href="/#tracker">Tracker</a>
        <a href="/#bookshelf">Books</a>
      </nav>

      <script id="train-data" type="application/json" dangerouslySetInnerHTML={{ __html: json }} />
      <Script src="/train.js" strategy="afterInteractive" />
    </>
  );
}
