import Script from 'next/script';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getLibrary } from '../lib/notion';
import { computeMetrics } from '../lib/metrics';
import { benchmarks } from '../lib/benchmarks';

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
  const metrics = computeMetrics({ stories: data.stories, booksRead: books.length });
  const bm = benchmarks(metrics);

  const clientData = { ...data, metrics, books };
  const json = JSON.stringify(clientData).replace(/</g, '\\u003c');

  const fmtNum = n => n.toLocaleString();

  return (
    <>
      <header className="band hero">
        <div>
          <h1>Mohammad Khan</h1>
          <p className="lede">Engineer, filmmaker and writer from Columbus, Ohio. Fiction, essays, tools and projects. One story a week since 2020. No likes, no comments — if something here helped you, share it with someone it&apos;ll help too.</p>
        </div>

        {metrics.weeksPublished > 0 && (
          <section className="m-stats" aria-label="Library by the numbers">
            {[
              { key: 'wp', raw: metrics.weeksPublished, val: fmtNum(metrics.weeksPublished), note: bm.weeksPublished },
              { key: 'lr', raw: metrics.longestRun, val: fmtNum(metrics.longestRun), note: bm.longestRun },
              { key: 'wc', raw: metrics.words, val: fmtNum(metrics.words), note: bm.words },
              { key: 'sc', raw: metrics.stories, val: fmtNum(metrics.stories), note: bm.stories },
              { key: 'aw', raw: metrics.avgWords, val: fmtNum(metrics.avgWords), note: bm.avgWords },
              { key: 'br', raw: metrics.booksRead, val: fmtNum(metrics.booksRead), note: bm.booksRead },
            ].filter(({ raw }) => raw > 0).map(({ key, val, note }) => (
              <div key={key} className="m-stat">
                <b>{val}</b>
                <small>{note}</small>
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
              <button data-k="Product" aria-pressed="false">Products</button>
              <button data-k="Project" aria-pressed="false">Projects</button>
            </div>
            <div id="grid" />
            <div className="legend">
              <span>Each square is one week · tap one to see what I made</span>
              <span>Less <i style={{ background: 'var(--soft)' }} /><i style={{ background: 'color-mix(in srgb,var(--acc) 30%,var(--soft))' }} /><i style={{ background: 'color-mix(in srgb,var(--acc) 55%,var(--soft))' }} /><i style={{ background: 'color-mix(in srgb,var(--acc) 80%,var(--soft))' }} /><i style={{ background: 'var(--acc)' }} /> More</span>
            </div>
            <div className="det" id="det" hidden />
          </div>
          <div id="charts-view" hidden />
        </section>
      </header>

      <nav>
        <div className="in">
          <a href="#writing">Newsletter</a>
          <a href="#stories">Story database</a>
          <a href="#tools">Tools &amp; products</a>
          <a href="#projects">Projects</a>
          <a href="#bookshelf">Bookshelf</a>
        </div>
      </nav>

      <main className="band">
        <div className="bar">
          <input id="q" type="search" placeholder="Search titles" aria-label="Search titles" />
          <select id="f1" aria-label="Filter" />
          <select id="f2" aria-label="Filter" />
          <div className="seg" role="group" aria-label="View"><button id="vg" aria-pressed="true">Gallery</button><button id="vt" aria-pressed="false">Table</button></div>
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
