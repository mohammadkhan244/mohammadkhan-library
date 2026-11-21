import { ImageResponse } from 'next/og';
import { getLibrary } from '../../../lib/notion';
import { classifyStory } from '../../../lib/dewey';
import { loadOgFonts, ogFontList } from '../../../lib/og-fonts';
import { checkoutCard } from '../../../lib/og-card';

export const revalidate = 3600;

function stamp(isoDate, deg) {
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const [y, m, d] = isoDate.split('-').map(Number);
  return { text: `${months[m - 1]} ${d} ${y}`, deg };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const w = searchParams.get('w');

  const [data, fonts] = await Promise.all([getLibrary(), loadOgFonts()]);

  // Find story by week number
  const story = w ? data.stories.find((s) => s.w === w) : null;

  if (!story) {
    // Generic checkout card — no matching story
    const today = new Date().toISOString().slice(0, 10);
    return new ImageResponse(
      checkoutCard({
        callNo: 'LIB KHA',
        title: 'The Library',
        stamps: [stamp(today, 1.5)],
      }),
      { width: 1200, height: 630, fonts: ogFontList(fonts) },
    );
  }

  const { room, dewey } = classifyStory(story);
  const isFiction = room === 'fiction';

  const callNo = isFiction
    ? `FIC KHA ${story.w}`
    : `${dewey || '808'} KHA ${story.w}`;

  const fmt = story.f === 'Short Story' ? 'Short story' : story.f || '';
  const wc  = story.wc || 0;
  const wcStr = wc > 0 ? wc.toLocaleString() + ' words' : '';
  const rt  = wc > 0 ? `${Math.ceil(wc / 200)} min read` : '';
  const subtitle = [fmt, wcStr, rt].filter(Boolean).join(' · ');

  const today = new Date().toISOString().slice(0, 10);
  const stamps = [stamp(story.d, 1.5), stamp(today, -2)];

  return new ImageResponse(
    checkoutCard({ callNo, title: story.t, subtitle, stamps }),
    { width: 1200, height: 630, fonts: ogFontList(fonts) },
  );
}
