// WCAG 2.1 relative luminance + contrast ratio helpers.
// All inputs are hex strings like "#064f6e".

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function linearize(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(hex1, hex2) {
  const l1 = luminance(hex1), l2 = luminance(hex2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Return whichever of dark/light gives higher contrast against bg.
// dark = "#111314", light = "#f5ecc2" (Wada Black and Sulphur Yellow).
const DARK  = '#111314';
const LIGHT = '#f5ecc2';

export function bestTextColor(bgHex) {
  const rDark  = contrastRatio(bgHex, DARK);
  const rLight = contrastRatio(bgHex, LIGHT);
  return rDark >= rLight ? DARK : LIGHT;
}

// Assert ≥4.5:1 for all spine bg colours and log a table.
// Called once at startup only in development; no-ops in production.
export function assertSpineContrast(spineColors) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') return;
  const rows = spineColors.map(({ name, hex }) => {
    const best = bestTextColor(hex);
    const ratio = contrastRatio(hex, best);
    const pass = ratio >= 4.5;
    return { name, hex, text: best, ratio: ratio.toFixed(2), pass };
  });
  const header = 'Spine contrast check';
  const failed = rows.filter(r => !r.pass);
  if (typeof console !== 'undefined') {
    console.table(rows);
    if (failed.length) console.error(header + ': FAIL — ' + failed.map(r => r.name).join(', '));
    else console.log(header + ': all pass ≥4.5:1');
  }
}
