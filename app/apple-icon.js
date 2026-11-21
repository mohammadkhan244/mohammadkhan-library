import { ImageResponse } from 'next/og';
import { getLibrary } from '../lib/notion';

export const revalidate = 3600;
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

function weekCount(data) {
  const tz = 'America/Chicago';
  const chi = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  const dow = chi.getDay();
  const daysFromMon = dow === 0 ? 6 : dow - 1;
  const mon = new Date(chi);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(chi.getDate() - daysFromMon);
  const start = mon.toISOString().slice(0, 10);
  const end = new Date(mon.getTime() + 7 * 86400000).toISOString().slice(0, 10);
  return [...(data.stories || []), ...(data.posts || [])].filter(
    (x) => x.d >= start && x.d < end,
  ).length;
}

function heatFill(n) {
  if (n === 0) return ['#051230', '#40456a'];
  if (n === 1) return ['#40456a', null];
  if (n === 2) return ['#4f4086', null];
  if (n === 3) return ['#66629c', null];
  return ['#b5b1d8', null];
}

export default async function AppleIcon() {
  const data = await getLibrary();
  const [fill, border] = heatFill(weekCount(data));
  const sq = Math.round(180 * 0.6); // 108
  const outerR = Math.round(6 * (180 / 32)); // ≈34
  const innerR = Math.round(3 * (180 / 32)); // ≈17

  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: outerR,
          background: '#111314',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: sq,
            height: sq,
            borderRadius: innerR,
            background: fill,
            border: border ? `1px solid ${border}` : undefined,
            boxSizing: 'border-box',
          }}
        />
      </div>
    ),
    { width: 180, height: 180 },
  );
}
