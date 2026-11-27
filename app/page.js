import Script from 'next/script';
import { getLibrary, getNotionBooks, getStoryExcerpt } from '../lib/notion';
import HeroScene from '../components/HeroScene';
import questionsRaw from '../data/questions.json';

export const revalidate = 3600;

export const metadata = {
  title: 'Mohammad Khan',
  description: 'Engineer, filmmaker and writer from Columbus, Ohio. Fiction, essays, tools and projects.',
};

// ── URLs (fill in) ────────────────────────────────────────────
const LINKEDIN_URL = 'https://www.linkedin.com/in/mohammadukhan/';
const SUBSTACK_URL = 'https://mohammadkhan.substack.com/';

// ── Active thread for "Currently exploring" panel ─────────────
// Set an Active flag in Notion later; for now hardcoded here.
const ACTIVE_THREAD = 'Why do systems protect themselves?';

// ── Helpers ───────────────────────────────────────────────────

function firstSentence(text) {
  if (!text) return '';
  const m = text.match(/^[^.!?]*[.!?]/);
  return m ? m[0].trim() : text.slice(0, 120).trim();
}

function pickThreadGlimpse(stories, dayIdx) {
  const map = {};
  for (const s of stories) {
    if (s.thread) (map[s.thread] = map[s.thread] || []).push(s);
  }
  const eligible = Object.entries(map).filter(([, ss]) => ss.length >= 3);
  if (!eligible.length) return null;
  const [threadName, ts] = eligible[dayIdx % eligible.length];
  const start = (dayIdx * 3) % ts.length;
  const three = [0, 1, 2].map(i => ts[(start + i) % ts.length].t);
  return { threadName, glimpse: three.join(' → ') };
}

// ── SVG tiles for "A few ways in" ─────────────────────────────

function TrainTile() {
  return (
    <svg viewBox="0 0 56 56" fill="none" aria-hidden="true" className="fd-way-tile">
      <rect width="56" height="56" rx="8" fill="var(--heat-0)" />
      <rect x="10" y="19" width="36" height="2.5" rx="1" fill="var(--text)" opacity="0.7" />
      <rect x="10" y="27" width="28" height="2.5" rx="1" fill="var(--accent)" opacity="0.9" />
      <rect x="10" y="35" width="20" height="2.5" rx="1" fill="var(--text)" opacity="0.3" />
    </svg>
  );
}

function LibraryTile() {
  return (
    <svg viewBox="0 0 56 56" fill="none" aria-hidden="true" className="fd-way-tile">
      <rect width="56" height="56" rx="8" fill="var(--heat-0)" />
      <rect x="10" y="12" width="7"  height="34" rx="2" fill="#064f6e" />
      <rect x="20" y="18" width="6"  height="28" rx="2" fill="#ae5224" />
      <rect x="29" y="14" width="8"  height="32" rx="2" fill="#40456a" />
      <rect x="40" y="20" width="5"  height="26" rx="2" fill="var(--muted)" />
      <rect x="10" y="46" width="35" height="2"  rx="1" fill="var(--border)" />
    </svg>
  );
}

function LabTile() {
  return (
    <svg viewBox="0 0 56 56" fill="none" aria-hidden="true" className="fd-way-tile">
      <rect width="56" height="56" rx="8" fill="var(--heat-0)" />
      <line x1="12" y1="42" x2="30" y2="18" stroke="var(--accent)" strokeWidth="1.5" />
      <line x1="30" y1="18" x2="46" y2="34" stroke="var(--accent)" strokeWidth="1.5" />
      <line x1="12" y1="42" x2="46" y2="34" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="12" cy="42" r="4.5" fill="var(--accent)" />
      <circle cx="30" cy="18" r="4.5" fill="#ae5224" />
      <circle cx="46" cy="34" r="4.5" fill="var(--accent)" />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────

export default async function FrontDoor() {
  const [data, notionBooks] = await Promise.all([
    getLibrary(),
    getNotionBooks(),
  ]);

  const dayIdx = Math.floor(Date.now() / 86400000);
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const qIdx = dayOfYear % questionsRaw.length;
  const dailyQuestion = questionsRaw[qIdx];

  // "A few ways in" — Train entry
  const threadGlimpse = pickThreadGlimpse(data.stories, dayIdx);

  // "A few ways in" — Library entry
  const latestStory = data.stories[0] || null;
  let libGlimpse = latestStory?.t || '';
  if (latestStory?.nid) {
    try {
      const exc = await getStoryExcerpt(latestStory.nid);
      const sent = firstSentence(exc);
      if (sent) libGlimpse = `${latestStory.t} — ${sent}`;
    } catch { /* excerpt optional */ }
  }

  // "Currently exploring" panel
  const activeStories = data.stories
    .filter(s => s.thread === ACTIVE_THREAD)
    .slice(0, 3);
  const activeSubjects = [...new Set(activeStories.flatMap(s => s.subjects || []))];
  const relatedBook = notionBooks.find(b =>
    b.subjects?.some(subj => activeSubjects.includes(subj))
  ) ?? null;

  // Stacked list: Story Database → STORY, Books I've Read → BOOK I READ
  const exploreItems = [
    ...activeStories.map(s => ({ type: 'STORY',      t: s.t, url: s.url,       key: s.nid || s.t })),
    ...(relatedBook ? [{ type: 'BOOK I READ', t: relatedBook.t, url: relatedBook.url || '', key: 'book-' + relatedBook.t }] : []),
  ].slice(0, 4);

  const questionsJson = JSON.stringify(questionsRaw).replace(/</g, '\\u003c');

  return (
    <>
      {/* ── Site header ── */}
      <header className="fd-header">
        <a href="/" className="fd-logo" aria-label="Mohammad Khan — home">MOHAMMAD KHAN</a>
        <nav className="fd-nav" aria-label="Site">
          <a href="/train">Train of Thought</a>
          <a href="/library">Library</a>
          <a href="/lab">Lab</a>
          <a href="/work">Work with me</a>
        </nav>
        <button id="theme-toggle" className="fd-theme-btn" aria-label="Switch theme">
          <svg id="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               aria-hidden="true">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg id="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </header>

      {/* ── Hero ── */}
      <section className="fd-hero band">
        {/* Left column */}
        <div className="fd-hero-left">
          <h1 className="fd-h1">
            I{' '}
            <span id="h1-phrase" className="fd-phrase">build things</span>
            {' '}to understand the world.
          </h1>

          <div className="fd-question-box">
            <p className="fd-q-label">QUESTIONS WORTH EXPLORING</p>
            <div className="fd-q-row">
              <p id="question-text" className="fd-q-text">{dailyQuestion.text}</p>
              <a id="q-link" href={dailyQuestion.href} className="fd-q-link">{dailyQuestion.linkText} →</a>
            </div>
            <button id="next-question" className="fd-q-btn" aria-label="Show another question"
                    title="Show another question">↺</button>
          </div>

          <div className="fd-hero-actions">
            <a href="/train" className="fd-btn-primary">Start wandering →</a>
            <a href="/work"  className="fd-btn-outlined">Work with me →</a>
          </div>
        </div>

        {/* Right column — SVG scene */}
        <div className="fd-hero-right">
          <HeroScene />
        </div>
      </section>

      {/* ── A few ways in ── */}
      <section className="fd-ways band" aria-label="A few ways in">
        <p className="fd-ways-hd">A FEW WAYS IN</p>

        {/* Train of Thought */}
        <a href="/train" className="fd-way-row">
          <TrainTile />
          <div className="fd-way-content">
            <span className="fd-way-title">Train of Thought</span>
            <span className="fd-way-glimpse">
              {threadGlimpse
                ? `${threadGlimpse.threadName}: ${threadGlimpse.glimpse}`
                : 'Pick a train. Each one takes you through my writing, stop by stop.'}
            </span>
          </div>
          <span className="fd-way-arrow" aria-hidden="true">→</span>
        </a>

        {/* Library */}
        <a href="/library" className="fd-way-row">
          <LibraryTile />
          <div className="fd-way-content">
            <span className="fd-way-title">Library</span>
            <span className="fd-way-glimpse">
              {libGlimpse || 'Stories, essays, tools and projects. One a week since 2020.'}
            </span>
          </div>
          <span className="fd-way-arrow" aria-hidden="true">→</span>
        </a>

        {/* Lab */}
        <a href="https://story-graph-three.vercel.app/" className="fd-way-row"
           target="_blank" rel="noopener noreferrer">
          <LabTile />
          <div className="fd-way-content">
            <span className="fd-way-title">Lab</span>
            <span className="fd-way-glimpse">
              Story Map: a founder moving abroad wrote one day in his new city.
              The loneliness he was leaving showed up in the story.
            </span>
          </div>
          <span className="fd-way-arrow" aria-hidden="true">→</span>
        </a>
      </section>

      {/* ── Currently exploring ── */}
      <section className="fd-exploring band" aria-label="Currently exploring">
        <p className="fd-exp-label">CURRENTLY EXPLORING</p>
        <h2 className="fd-exp-thread">{ACTIVE_THREAD}</h2>
        <p className="fd-exp-desc">A question I keep returning to, and what I&apos;ve made and read about it.</p>

        {exploreItems.length > 0 && (
          <div className="fd-exp-list">
            {exploreItems.map(item => {
              const isExt = item.url?.startsWith('http');
              if (item.url) {
                return (
                  <a
                    key={item.key}
                    href={item.url}
                    className="fd-exp-item"
                    {...(isExt ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <span className="fd-exp-item-type">{item.type}</span>
                    <span className="fd-exp-item-title">{item.t}</span>
                  </a>
                );
              }
              return (
                <div key={item.key} className="fd-exp-item">
                  <span className="fd-exp-item-type">{item.type}</span>
                  <span className="fd-exp-item-title">{item.t}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="fd-exp-actions">
          <a href="/train" className="fd-btn-ride">Ride this line →</a>
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer"
             className="fd-btn-outlined">Have your own take? Let&apos;s talk →</a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="fd-footer band">
        <a href="/" className="fd-footer-logo" aria-label="Mohammad Khan — home">
          MOHAMMAD KHAN
        </a>
        <div className="fd-footer-links">
          <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <span aria-hidden="true">·</span>
          <a href={SUBSTACK_URL} target="_blank" rel="noopener noreferrer">Substack</a>
        </div>
      </footer>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="fd-tabs" aria-label="Pages">
        <a href="/" aria-current="page">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Home
        </a>
        <a href="/train">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="4" width="16" height="16" rx="2"/>
            <line x1="4" y1="12" x2="20" y2="12"/>
            <line x1="12" y1="4" x2="12" y2="20"/>
          </svg>
          Train
        </a>
        <a href="/library">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          Library
        </a>
        <a href="/lab">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 3H15"/>
            <path d="M10 3v6l-4 9a1 1 0 0 0 .9 1.5h10.2A1 1 0 0 0 18 18l-4-9V3"/>
          </svg>
          Lab
        </a>
      </nav>

      <script
        id="questions-data"
        type="application/json"
        dangerouslySetInnerHTML={{ __html: questionsJson }}
      />
      <Script src="/home.js" strategy="afterInteractive" />
    </>
  );
}
