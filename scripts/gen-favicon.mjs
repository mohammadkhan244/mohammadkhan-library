// Generates app/favicon.ico — a 32×32 PNG-in-ICO with a lit #b5b1d8 center square.
// Run once: node scripts/gen-favicon.mjs

import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// CRC32 (standard polynomial)
const CRC_T = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    c = (CRC_T[(c ^ buf[i]) & 0xff] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.allocUnsafe(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

function makePng(w, h, pixel) {
  const SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGB

  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.allocUnsafe(1 + w * 3);
    row[0] = 0;
    for (let x = 0; x < w; x++) {
      const [r, g, b] = pixel(x, y);
      row[1 + x * 3 + 0] = r;
      row[1 + x * 3 + 1] = g;
      row[1 + x * 3 + 2] = b;
    }
    rows.push(row);
  }
  const compressed = deflateSync(Buffer.concat(rows), { level: 9 });
  return Buffer.concat([
    SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function wrapIco(pngData, w, h) {
  const hdr = Buffer.allocUnsafe(6);
  hdr.writeUInt16LE(0, 0);
  hdr.writeUInt16LE(1, 2); // type: ICO
  hdr.writeUInt16LE(1, 4); // count: 1
  const dir = Buffer.allocUnsafe(16);
  dir[0] = w > 255 ? 0 : w;
  dir[1] = h > 255 ? 0 : h;
  dir[2] = 0; dir[3] = 0;
  dir.writeUInt16LE(1, 4);  // planes
  dir.writeUInt16LE(32, 6); // bits per pixel
  dir.writeUInt32LE(pngData.length, 8);
  dir.writeUInt32LE(6 + 16, 12); // offset
  return Buffer.concat([hdr, dir, pngData]);
}

const W = 32;
const sq  = Math.round(W * 0.6); // 19 — lit inner square (60%)
const off = Math.floor((W - sq) / 2); // 6

const BG  = [0x11, 0x13, 0x14]; // #111314 Black
const LIT = [0xb5, 0xb1, 0xd8]; // #b5b1d8 Grayish Lavender A (heat-4, lit)

const png = makePng(W, W, (x, y) =>
  x >= off && x < off + sq && y >= off && y < off + sq ? LIT : BG,
);
const ico = wrapIco(png, W, W);

const dest = join(ROOT, 'app', 'favicon.ico');
writeFileSync(dest, ico);
console.log(`✓ app/favicon.ico  (${ico.length} bytes)`);
