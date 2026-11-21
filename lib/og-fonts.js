// Font data loader for next/og ImageResponse routes.
// Fetches from Google Fonts CDN; module-level cache survives warm invocations.

const _cache = {};

export async function loadOgFonts() {
  if (_cache.ready) return _cache;

  // Old Android WebKit — Google Fonts returns TTF for this UA.
  // Satori (bundled with next/og) does not support WOFF2 or EOT.
  const UA = 'Mozilla/5.0 (Linux; U; Android 2.2; en-us) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1';

  const fetchCSS = (q) =>
    fetch(`https://fonts.googleapis.com/css2?family=${q}&display=block`, {
      headers: { 'User-Agent': UA },
    })
      .then((r) => r.text())
      .catch(() => '');

  const fetchFont = (css) => {
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) return Promise.resolve(null);
    return fetch(url)
      .then((r) => r.arrayBuffer())
      .catch(() => null);
  };

  const [gildaCSS, j400CSS, j600CSS] = await Promise.all([
    fetchCSS('Gilda+Display'),
    fetchCSS('Josefin+Sans:wght@400'),
    fetchCSS('Josefin+Sans:wght@600'),
  ]);

  const [gilda, josefin, josefin600] = await Promise.all([
    fetchFont(gildaCSS),
    fetchFont(j400CSS),
    fetchFont(j600CSS),
  ]);

  _cache.gilda = gilda;
  _cache.josefin = josefin;
  _cache.josefin600 = josefin600;
  _cache.ready = true;

  return _cache;
}

export function ogFontList(f) {
  const list = [];
  if (f.gilda)
    list.push({ name: 'Gilda Display', data: f.gilda, weight: 400, style: 'normal' });
  if (f.josefin)
    list.push({ name: 'Josefin Sans', data: f.josefin, weight: 400, style: 'normal' });
  if (f.josefin600)
    list.push({ name: 'Josefin Sans', data: f.josefin600, weight: 600, style: 'normal' });
  return list;
}
