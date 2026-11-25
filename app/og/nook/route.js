import { ImageResponse } from 'next/og';
import { getLibrary } from '../../../lib/notion';
import { loadOgFonts, ogFontList } from '../../../lib/og-fonts';

export const revalidate = 3600;

export async function GET() {
  const [data, fonts] = await Promise.all([getLibrary(), loadOgFonts()]);

  // Pick a story title for the OG card
  const story = data.stories.find(s => s.t) || { t: 'A story' };

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%',
          background: '#051230',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'flex-start',
          padding: '64px 80px',
          fontFamily: 'Josefin Sans',
        }}
      >
        {/* Lamp shade */}
        <div style={{
          width: 80, height: 32,
          background: '#ae5224',
          clipPath: 'polygon(12% 0%,88% 0%,100% 100%,0% 100%)',
          marginBottom: 4,
        }} />
        {/* Bulb glow */}
        <div style={{
          width: 20, height: 20, borderRadius: '50%',
          background: '#fdc57e',
          marginLeft: 30, marginBottom: 36,
          boxShadow: '0 0 40px 20px rgba(253,197,126,.3)',
        }} />

        <div style={{ color: '#b5b1d8', fontSize: 14, letterSpacing: 4, marginBottom: 20 }}>
          THE READING NOOK
        </div>
        <div style={{
          fontFamily: 'Gilda Display',
          fontSize: 56, color: '#f5ecc2',
          lineHeight: 1.1, maxWidth: 800,
          marginBottom: 32,
        }}>
          {story.t}
        </div>
        <div style={{ color: '#b5b1d8', fontSize: 15, letterSpacing: 2 }}>
          MOHAMMAD KHAN · LIBRARY
        </div>
      </div>
    ),
    {
      width: 1200, height: 630,
      fonts: ogFontList(fonts),
    },
  );
}
