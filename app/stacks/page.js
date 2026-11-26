import Script from 'next/script';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getLibrary } from '../../lib/notion';
import { computeMetrics } from '../../lib/metrics';
import { benchmarks } from '../../lib/benchmarks';
import { classifyStory } from '../../lib/dewey';

export const revalidate = 3600;

function loadBooks() {
  try {
    return JSON.parse(readFileSync(join(process.cwd(), 'data', 'books.json'), 'utf8'));
  } catch {
    return [];
  }
}

export default async function StacksPage() {
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

  const classifiedStories = data.stories.map(s => ({ ...s, ...classifyStory(s) }));
  const clientData = { ...data, stories: classifiedStories, metrics, books, bm };
  const json = JSON.stringify(clientData).replace(/</g, '\\u003c');

  return (
    <>
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
