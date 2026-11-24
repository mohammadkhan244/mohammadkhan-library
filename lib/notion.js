import snapshot from './snapshot.json';
import projects from './projects.json';

// Notion data source IDs (the "collection://" IDs of each database)
const DS = {
  stories: 'a394e75e-4f31-4506-85f5-f865146fa054',
  posts: 'd738c733-9c76-40ae-bf02-ecb31d93229e',
  tools: 'baeb195e-4e81-404b-95a2-183e57d977e8',
};
const VERSION = '2025-09-03';

export async function notion(path, body) {
  const res = await fetch('https://api.notion.com/v1/' + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: 'Bearer ' + process.env.NOTION_TOKEN,
      'Notion-Version': VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Notion ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

async function queryAll(id, body = {}) {
  const out = [];
  let cursor;
  do {
    const r = await notion(`data_sources/${id}/query`, { ...body, page_size: 100, start_cursor: cursor });
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return out;
}

const text = p => (p?.title || p?.rich_text || []).map(t => t.plain_text).join('');
const sel = p => p?.select?.name || p?.status?.name || '';
const multi = p => (p?.multi_select || []).map(o => o.name);
const date = p => p?.date?.start?.slice(0, 10) || '';
const num = p => p?.number ?? 0;
const bool = p => p?.checkbox || false;
const coverUrl = pg => pg.cover?.external?.url || '';

async function getStories() {
  const pages = await queryAll(DS.stories, { sorts: [{ property: 'Date', direction: 'descending' }] });
  return pages
    .map(pg => {
      const P = pg.properties;
      const name = text(P.Name);
      const m = name.match(/^Week\s+([\d-]+)\s*:\s*(.*)$/);
      const result = sel(P.Result);
      return {
        w: m ? m[1] : '',
        t: (m ? m[2] : name).trim(),
        d: date(P.Date) || pg.created_time.slice(0, 10),
        f: sel(P.Format),
        g: multi(P.Genre),
        fav: !!P['Personal Favorite']?.checkbox,
        aw: result && result !== 'Did not advance' ? `${result} · ${text(P.Contest)}` : '',
        url: pg.public_url || pg.url,
        img: coverUrl(pg) || `/img/${pg.id.replace(/-/g, '')}`,
        wc: num(P['Word Count']),
        wksc: num(P['Weeks Covered']),
        comp: bool(P['Competition Entry']),
        result: sel(P.Result),
      };
    })
    .filter(s => s.t && s.d);
}

async function getPosts() {
  const pages = await queryAll(DS.posts, { sorts: [{ property: 'Published', direction: 'descending' }] });
  return pages
    .map(pg => {
      const P = pg.properties;
      const url = P['Article URL']?.url || '';
      return { d: date(P.Published), t: text(P.Title), url, img: url ? `/og?u=${encodeURIComponent(url)}` : '' };
    })
    .filter(p => p.t && p.d && p.url);
}

const toolSlug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const TOOL_IMAGES = {
  'the-reasoning-machine': '/tools/reasoning-machine.svg',
  'orbit': '/tools/orbit.png',
  'write-your-future-early-warning-system': '/tools/write-your-future.svg',
  'making-sense-of-the-future-season-1': '/tools/making-sense-s1.png',
  'making-sense-of-the-future-season-2': '/tools/making-sense-s2.png',
  'five-stories-strong-season-1': '/tools/five-stories-s1.png',
  'fictioneering-strategy-deck': '/tools/fictioneering-deck.png',
  'imagining-life-with-ai-pilot-webinar': '/tools/imagining-life-with-ai.png',
};

async function getTools() {
  const pages = await queryAll(DS.tools);
  return pages
    .map(pg => {
      const P = pg.properties;
      const name = text(P.Name);
      return {
        t: name,
        ty: sel(P['Product Type']),
        st: sel(P.Stage),
        one: text(P['One-liner']),
        d: pg.created_time.slice(0, 10),
        url: pg.public_url || '',
        img: TOOL_IMAGES[toolSlug(name)] || '',
      };
    })
    .filter(t => t.t && ['Launched', 'In Development'].includes(t.st) && t.ty !== 'Conference Proposal')
    .sort((a, b) => (a.st === b.st ? a.t.localeCompare(b.t) : a.st === 'Launched' ? -1 : 1));
}

// Each database falls back to the bundled snapshot on its own, so one failure never blanks the site.
export async function getLibrary() {
  if (!process.env.NOTION_TOKEN) return { ...snapshot, projects, live: false };
  const safe = async (fn, fb) => {
    try { const r = await fn(); return r.length ? r : fb; } catch (e) { console.error(e); return fb; }
  };
  const [stories, posts, tools] = await Promise.all([
    safe(getStories, snapshot.stories),
    safe(getPosts, snapshot.posts),
    safe(getTools, snapshot.tools),
  ]);
  return { stories, posts, tools, projects, live: true };
}
