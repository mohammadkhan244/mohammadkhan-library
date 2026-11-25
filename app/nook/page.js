import Script from 'next/script';
import { getLibrary, getStoryExcerpt } from '../../lib/notion';
import { classifyStory } from '../../lib/dewey';
import Radio from '../../components/Radio';

export const revalidate = 3600;

export const metadata = {
  title: 'The reading nook · Mohammad Khan',
  description: 'Rain, a lamp and something to read. Stay a while.',
  openGraph: {
    title: 'The reading nook · Mohammad Khan',
    description: 'Rain, a lamp and something to read. Stay a while.',
    images: [{ url: '/og/nook', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image' },
};

const FICTION_FORMATS = new Set(['Short Story', 'Screenplay', 'Poem', 'Rap', 'StagePlay', 'Song', 'Anthology']);

// Extract Notion page UUID from a Notion URL or /img/ path
function notionIdFromStory(s) {
  if (s.nid) return s.nid;
  // Try URL: ends with 32-char hex (with or without dashes)
  const m = s.url?.match(/([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})(?:\?|$)/i);
  if (m) {
    const h = m[1].replace(/-/g, '');
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
  }
  // Try img: /img/{hex32}
  const im = s.img?.match(/\/img\/([0-9a-f]{32})/i);
  if (im) {
    const h = im[1];
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
  }
  return null;
}

function spineColor(format) {
  switch (format) {
    case 'Short Story': return 'var(--spine-short-story)';
    case 'Screenplay':  return 'var(--spine-screenplay)';
    case 'Poem':        return 'var(--spine-poem)';
    case 'Rap':         return 'var(--spine-rap)';
    case 'Essay':
    case 'Memoir':      return 'var(--spine-essay)';
    default:            return 'var(--spine-post)';
  }
}

function spineTextColor(format) {
  if (format === 'Poem') return '#111314';
  return '#f5ecc2';
}

function callLabel(classified, story) {
  if (classified.room === 'fiction') return 'FIC';
  return classified.dewey || '808';
}

// Pick a story that changes each ISR cycle (seeded by day)
function pickFeatured(eligible) {
  if (!eligible.length) return null;
  const day = Math.floor(Date.now() / 86400000);
  return eligible[day % eligible.length];
}

function buildShelfRows(stories, rowCount = 4, perRow = 10) {
  const pool = stories.slice(0, rowCount * perRow);
  const rows = [];
  for (let r = 0; r < rowCount; r++) {
    rows.push(pool.slice(r * perRow, r * perRow + perRow));
  }
  return rows;
}

// Deterministic height variation for spines using title hash
function spineHeight(title) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) | 0;
  return 88 + (Math.abs(h) % 32); // 88–120px
}

export default async function NookPage() {
  const data = await getLibrary();

  const eligible = data.stories
    .filter(s => s.t && (FICTION_FORMATS.has(s.f) || s.f === 'Essay' || s.f === 'Memoir'))
    .map(s => ({ ...s, _nid: notionIdFromStory(s) }));

  const featured = pickFeatured(eligible);

  let excerpt = '';
  let classified = { room: 'fiction', shelf: 'Other', dewey: null };
  if (featured) {
    classified = classifyStory(featured);
    if (featured._nid) {
      excerpt = await getStoryExcerpt(featured._nid).catch(() => '');
    }
  }

  const shelfRows = buildShelfRows(data.stories);

  // Eligible list for client-side "Pull another book"
  const clientEligible = eligible.map(s => ({
    id: s._nid || s.url, t: s.t, f: s.f, wc: s.wc || 0, url: s.url,
  }));
  const initBook = featured ? {
    id: featured._nid || featured.url,
    t: featured.t,
    f: featured.f,
    wc: featured.wc || 0,
    url: featured.url,
    excerpt,
    call: callLabel(classified, featured),
  } : null;

  const clientJson = JSON.stringify({ eligible: clientEligible, initBook })
    .replace(/</g, '\\u003c');

  const wc = featured?.wc ? featured.wc.toLocaleString() : '';
  const callBadge = featured ? callLabel(classified, featured) : '';
  const readMins = featured?.wc ? Math.ceil(featured.wc / 230) : null;

  // Rain streaks: 22 total, alternating two colours
  const rainStreaks = Array.from({ length: 22 }, (_, i) => ({
    left: `${4 + i * 4.3}%`,
    height: `${32 + (i * 7) % 28}px`,
    delay: `${((i * 0.37) % 2).toFixed(2)}s`,
    speed: `${(0.8 + (i * 0.19) % 0.9).toFixed(2)}s`,
    color: i % 3 === 0 ? '#b5b1d8' : '#40456a',
    opacity: i % 3 === 0 ? 0.55 : 0.4,
  }));

  return (
    <>
      <div data-nook>
        {/* ── Chrome ── */}
        <header className="nook-chrome">
          <a className="nook-home" href="/">
            <span className="nook-home-name">Mohammad Khan</span>
            <span className="nook-home-sub">Library</span>
          </a>
          <span className="nook-timer-display" id="nook-timer-display" hidden />
          <div className="nook-chrome-right">
            <button id="nook-theme" className="nook-theme-btn" aria-label="Switch theme">
              <svg id="nk-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              <svg id="nk-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            </button>
          </div>
        </header>

        {/* ── Scene ── */}
        <div className="nook-scene">

          {/* Left — arched window */}
          <aside className="nook-window-col" aria-hidden="true">
            <div className="nook-arch-frame">
              <div className="nook-window-glass" id="nook-rain">
                <div className="nook-moon" />
                <div className="nook-rain-layer">
                  {rainStreaks.map((s, i) => (
                    <span
                      key={i}
                      className="rs"
                      style={{
                        left: s.left,
                        height: s.height,
                        animationDelay: s.delay,
                        animationDuration: s.speed,
                        background: s.color,
                        opacity: s.opacity,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Centre — lamp + reading */}
          <main className="nook-read-col">
            {/* Lamp */}
            <div className="nook-lamp" aria-hidden="true">
              <div className="nook-lamp-shade">
                <div className="nook-lamp-bulb" id="nook-bulb" />
              </div>
              <div className="nook-lamp-neck" />
              <div className="nook-lamp-base" />
            </div>

            {/* Book */}
            <article className="nook-book" id="nook-book" aria-live="polite" aria-atomic="true">
              {featured ? (
                <>
                  <p className="nook-call-line" id="book-call">
                    <span className="nook-call-badge">{callBadge}</span>
                    <span className="nook-call-sep">·</span>
                    <span className="nook-call-format">{featured.f}</span>
                    {wc && <><span className="nook-call-sep">·</span><span className="nook-call-wc">{wc} words</span></>}
                  </p>
                  <h1 className="nook-title" id="book-title">{featured.t}</h1>
                  {excerpt ? (
                    <div className="nook-excerpt" id="book-excerpt">
                      <p>{excerpt}</p>
                    </div>
                  ) : (
                    <div className="nook-excerpt nook-excerpt--empty" id="book-excerpt">
                      <p>No preview available for this piece.</p>
                    </div>
                  )}
                  <div className="nook-actions">
                    <a
                      className="nook-btn-read"
                      id="keep-reading"
                      href={featured.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >Keep reading</a>
                    <button className="nook-btn-sec" id="pull-book">Pull another book</button>
                    <button className="nook-btn-ghost" id="copy-link">Copy link</button>
                  </div>
                </>
              ) : (
                <p className="nook-excerpt--empty">The shelf is quiet tonight.</p>
              )}
            </article>

            {/* Radio */}
            <Radio radioId="nook-radio" />
          </main>

          {/* Right — dim shelf */}
          <aside className="nook-shelf-col" aria-label="Reading room shelf" aria-hidden="true">
            {shelfRows.map((row, ri) => (
              <div key={ri} className="nook-shelf-section">
                <div className="nook-shelf-row">
                  {row.map((s, si) => (
                    <div
                      key={si}
                      className="nook-spine-dim"
                      style={{
                        background: spineColor(s.f),
                        color: spineTextColor(s.f),
                        height: `${spineHeight(s.t)}px`,
                      }}
                    >
                      <span className="nook-spine-title">{s.t}</span>
                    </div>
                  ))}
                </div>
                <div className="nook-shelf-plank" />
              </div>
            ))}
          </aside>
        </div>

        {/* ── Toast ── */}
        <div className="toast" id="nook-toast" role="status" />

        {/* ── Mobile bottom tab bar ── */}
        <nav className="train-tabs nook-tabs" aria-label="Sections">
          <a href="/#stories">Stacks</a>
          <a href="/train">Train</a>
          <a href="/nook" aria-current="page">Nook</a>
          <a href="/#tracker">Tracker</a>
          <a href="/#bookshelf">Books</a>
        </nav>
      </div>

      <script id="nook-data" type="application/json" dangerouslySetInnerHTML={{ __html: clientJson }} />
      <Script src="/radio.js" strategy="afterInteractive" />
      <Script src="/nook.js" strategy="afterInteractive" />
    </>
  );
}
