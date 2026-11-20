import { notion } from '../../../lib/notion';

// Thumbnail for a Notion story page: its cover, else the first image in the page.
// Notion-hosted file URLs expire after an hour, so this redirect is cached for 50 minutes.
export async function GET(_req, { params }) {
  const { id } = await params;
  if (!/^[0-9a-f]{32}$/.test(id) || !process.env.NOTION_TOKEN) return new Response(null, { status: 404 });
  try {
    const page = await notion(`pages/${id}`);
    let url = page.cover?.external?.url || page.cover?.file?.url;
    if (!url) {
      const kids = await notion(`blocks/${id}/children?page_size=15`);
      const img = kids.results.find(b => b.type === 'image')?.image;
      url = img?.external?.url || img?.file?.url;
    }
    if (!url) return new Response(null, { status: 404, headers: { 'Cache-Control': 'public, s-maxage=86400' } });
    if (url.includes('images.unsplash.com')) url = url.replace(/([?&])q=\d+/, '$1q=60') + '&w=600';
    return new Response(null, {
      status: 302,
      headers: { Location: url, 'Cache-Control': 'public, s-maxage=3000, stale-while-revalidate=600' },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
