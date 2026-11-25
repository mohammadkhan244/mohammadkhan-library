import { getLibrary, getStoryExcerpt } from '../../../lib/notion';
import { classifyStory } from '../../../lib/dewey';

const FICTION_FORMATS = new Set(['Short Story', 'Screenplay', 'Poem', 'Rap', 'StagePlay', 'Song', 'Anthology']);

function callLabel(classified) {
  if (classified.room === 'fiction') return 'FIC';
  return classified.dewey || '808';
}

function notionId(s) {
  if (s.nid) return s.nid;
  const m = s.url?.match(/([0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12})(?:\?|$)/i);
  if (m) { const h = m[1].replace(/-/g,''); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; }
  const im = s.img?.match(/\/img\/([0-9a-f]{32})/i);
  if (im) { const h = im[1]; return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; }
  return null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const excludeStr = searchParams.get('exclude') || '';
  const exclude = new Set(excludeStr.split(',').filter(Boolean));

  const data = await getLibrary();

  const pool = data.stories
    .filter(s => s.t && (FICTION_FORMATS.has(s.f) || s.f === 'Essay' || s.f === 'Memoir'))
    .map(s => ({ ...s, _nid: notionId(s), _uid: notionId(s) || s.url }))
    .filter(s => !exclude.has(s._uid));

  if (!pool.length) {
    return Response.json({ error: 'no-more' }, { status: 404 });
  }

  const story = pool[Math.floor(Math.random() * pool.length)];
  const classified = classifyStory(story);

  let excerpt = '';
  if (story._nid) {
    try { excerpt = await getStoryExcerpt(story._nid); } catch {}
  }

  return Response.json({
    id: story._uid,
    t: story.t,
    f: story.f,
    wc: story.wc || 0,
    url: story.url,
    excerpt,
    call: callLabel(classified),
  });
}
