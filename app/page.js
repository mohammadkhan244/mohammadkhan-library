import Script from 'next/script';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getLibrary } from '../lib/notion';
import { computeMetrics } from '../lib/metrics';
import { benchmarks } from '../lib/benchmarks';
import { classifyStory } from '../lib/dewey';

export const revalidate = 3600;

function loadBooks() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'data', 'books.json'), 'utf8'));
  } catch {
    return [];
  }
}

export default async function Home() {
  const data = await getLibrary();
  const books = loadBooks();
  const metrics = computeMetrics({
    stories: data.stories,
    posts: data.posts,
    tools: data.tools,
    projects: data.projects,
    booksRead: books.length,
  });
  const bm = benchmarks(metrics);

  // Add Dewey classification to each story for the Stacks shelf view
  const classifiedStories = data.stories.map(s => ({ ...s, ...classifyStory(s) }));

  const clientData = { ...data, stories: classifiedStories, metrics, books, bm };
  const json = JSON.stringify(clientData).replace(/</g, '\\u003c');

  const fmtNum = n => n.toLocaleString();

  const metricCards = [
    { key: 'wp', raw: metrics.weeksPublished, val: fmtNum(metrics.weeksPublished), label: bm.weeksPublished?.label, cmp: bm.weeksPublished?.comparison },
    { key: 'lr', raw: metrics.longestRun,     val: fmtNum(metrics.longestRun),     label: bm.longestRun?.label,     cmp: bm.longestRun?.comparison },
    { key: 'wc', raw: metrics.words,          val: fmtNum(metrics.words),          label: bm.words?.label,          cmp: bm.words?.comparison },
    { key: 'sc', raw: metrics.stories,        val: fmtNum(metrics.stories),        label: bm.stories?.label,        cmp: bm.stories?.comparison },
    { key: 'aw', raw: metrics.avgWords,       val: fmtNum(metrics.avgWords),       label: bm.avgWords?.label,       cmp: bm.avgWords?.comparison },
    { key: 'br', raw: metrics.booksRead,      val: fmtNum(metrics.booksRead),      label: bm.booksRead?.label,      cmp: bm.booksRead?.comparison },
  ].filter(({ raw }) => raw > 0);

  return (
    <>
      <header className="band">
        <div className="hd-row">
          <div>
            <h1>Mohammad Khan</h1>
            <p className="lede">Engineer, filmmaker and writer from Columbus, Ohio. Fiction, essays, tools and projects. One story a week since 2020. No likes, no comments — if something here helped you, share it with someone it&apos;ll help too.</p>
          </div>
          <button id="theme-toggle" aria-label="Switch to light theme">
            <svg id="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg id="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
        </div>

        {metricCards.length > 0 && (
          <section className="m-stats" aria-label="Library by the numbers">
            {metricCards.map(({ key, val, label, cmp }) => (
              <div key={key} className="m-stat">
                <b>{val}</b>
                {label && <span className="m-lbl">{label}</span>}
                {cmp   && <span className="m-cmp">{cmp}</span>}
              </div>
            ))}
          </section>
        )}

        <section className="trk" aria-label="Build tracker">
          <div className="trk-hd">
            <div className="seg" role="group" aria-label="View">
              <button id="tab-tracker" aria-pressed="true">Tracker</button>
              <button id="tab-charts" aria-pressed="false">Charts</button>
            </div>
          </div>
          <div id="tracker-view">
            <div className="stats" id="stats" />
            <div className="chips" id="chips">
              <button data-k="" aria-pressed="true">Everything</button>
              <button data-k="Story" aria-pressed="false">Stories</button>
              <button data-k="Newsletter" aria-pressed="false">Newsletter</button>
              <button data-k="Tool" aria-pressed="false">Tools</button>
              <button data-k="Project" aria-pressed="false">Projects</button>
            </div>
            <div id="grid" />
            <div className="legend">
              <span>Each square is one week · tap one to see what I made</span>
              <span>Less{' '}
                <i style={{ background: 'var(--heat-0)' }} />
                <i style={{ background: 'var(--heat-1)' }} />
                <i style={{ background: 'var(--heat-2)' }} />
                <i style={{ background: 'var(--heat-3)' }} />
                <i style={{ background: 'var(--heat-4)' }} />
                {' '}More
              </span>
            </div>
            <div className="det" id="det" hidden />
          </div>
          <div id="charts-view" hidden />
        </section>
      </header>

      <nav>
        <div className="in">
          <a href="#writing">Newsletter</a>
          <a href="#stories">Stacks</a>
          <a href="/train">Train of thought</a>
          <a href="#tools">Tools</a>
          <a href="#projects">Projects</a>
          <a href="#bookshelf">Bookshelf</a>
        </div>
      </nav>

      <main className="band">
        <div className="bar">
          <input id="q" type="search" placeholder="Search titles" aria-label="Search titles" />
          <select id="f1" aria-label="Filter" />
          <select id="f2" aria-label="Filter" />
          <div className="seg" role="group" aria-label="View">
            <button id="vg" aria-pressed="true">Gallery</button>
            <button id="vs" aria-pressed="false">Shelf</button>
            <button id="vt" aria-pressed="false">Table</button>
          </div>
        </div>
        <div className="count" id="count" />
        <div id="out" />
      </main>

      <footer className="band">Posts open on Substack; stories open in my Notion Story Database.{data.live ? '' : ' (Snapshot — live sync starts once NOTION_TOKEN is set.)'}</footer>
      <div className="toast" id="toast" role="status" />
      <script id="data" type="application/json" dangerouslySetInnerHTML={{ __html: json }} />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
