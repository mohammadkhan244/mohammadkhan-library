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

  const [lf400CSS, lf700CSS, lf800CSS] = await Promise.all([
    fetchCSS('Libre+Franklin:wght@400'),
    fetchCSS('Libre+Franklin:wght@700'),
    fetchCSS('Libre+Franklin:wght@800'),
  ]);

  const [lf400, lf700, lf800] = await Promise.all([
    fetchFont(lf400CSS),
    fetchFont(lf700CSS),
    fetchFont(lf800CSS),
  ]);

  _cache.lf400 = lf400;
  _cache.lf700 = lf700;
  _cache.lf800 = lf800;
  _cache.ready = true;

  return _cache;
}

export function ogFontList(f) {
  const list = [];
  if (f.lf400)
    list.push({ name: 'Libre Franklin', data: f.lf400, weight: 400, style: 'normal' });
  if (f.lf700)
    list.push({ name: 'Libre Franklin', data: f.lf700, weight: 700, style: 'normal' });
  if (f.lf800)
    list.push({ name: 'Libre Franklin', data: f.lf800, weight: 800, style: 'normal' });
  return list;
}
