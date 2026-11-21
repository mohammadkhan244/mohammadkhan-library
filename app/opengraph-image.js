import { ImageResponse } from 'next/og';
import { getLibrary } from '../lib/notion';
import { computeMetrics } from '../lib/metrics';
import { loadOgFonts, ogFontList } from '../lib/og-fonts';
import { checkoutCard } from '../lib/og-card';
import books from '../data/books.json';

export const alt = 'Mohammad Khan · Library';
export const revalidate = 3600;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

function stamp(isoDate, deg) {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const [y, m, d] = isoDate.split('-').map(Number);
  return { text: `${months[m - 1]} ${d} ${y}`, deg };
}

export default async function HomeOgImage() {
  const [data, fonts] = await Promise.all([getLibrary(), loadOgFonts()]);

  const metrics = computeMetrics({
    stories: data.stories,
    posts: data.posts,
    tools: data.tools,
    projects: data.projects,
    booksRead: books.length,
  });

  const parts = [`${metrics.stories} stories`];
  if (metrics.words > 0) {
    const wStr = metrics.words >= 1000 ? `${Math.round(metrics.words / 1000)}k` : String(metrics.words);
    parts.push(`${wStr} words`);
  }
  parts.push(`${metrics.longestRun} weeks in a row`);
  const subtitle = parts.join(' · ');

  const today = new Date().toISOString().slice(0, 10);
  const recentDate = data.stories[0]?.d || today;
  const stamps = [stamp(recentDate, 1.5), stamp(today, -2)];

  return new ImageResponse(
    checkoutCard({
      callNo: 'LIB KHA',
      title: 'The Library',
      subtitle,
      stamps,
      subtitleFont: 'Gilda Display',
    }),
    { width: 1200, height: 630, fonts: ogFontList(fonts) },
  );
}
