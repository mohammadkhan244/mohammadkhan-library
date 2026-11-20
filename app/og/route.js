// Thumbnail for a Substack post: the post's og:image. Only your own publications are allowed.
const HOSTS = ['themohammadkhan.substack.com', 'fictioneering-newsletter.themohammadkhan.com'];

export async function GET(req) {
  const u = new URL(req.url).searchParams.get('u') || '';
  let target;
  try { target = new URL(u); } catch { return new Response(null, { status: 400 }); }
  if (target.protocol !== 'https:' || !HOSTS.includes(target.hostname)) return new Response(null, { status: 400 });
  try {
    const html = await (await fetch(target, { headers: { 'User-Agent': 'Mozilla/5.0' }, next: { revalidate: 604800 } })).text();
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
           || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (!m) return new Response(null, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=86400' } });
    return new Response(null, {
      status: 302,
      headers: { Location: m[1].replace(/&amp;/g, '&'), 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
