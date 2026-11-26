import Script from 'next/script';
import { getLibrary } from '../lib/notion';

export const revalidate = 3600;

// Week key helper — identical signature to app.js wk() so home.js can use pre-computed data
const wk = d => {
  const x = new Date(d + 'T12:00'), j = new Date(x.getFullYear(), 0, 1, 12);
  return [x.getFullYear(), Math.min(52, Math.floor((x - j) / 864e5 / 7))];
};

// Approximate word count by format when property is missing
const WC_DEFAULT = { 'Short Story': 1500, 'Screenplay': 10000, 'Poem': 200, 'Rap': 400, 'Essay': 2000, 'Memoir': 1800, 'StagePlay': 8000, 'Song': 300, 'Anthology': 5000 };

// Spine colour tokens — mirrors FC map in app.js
const FC = {
  'Short Story': 'var(--spine-short-story)', 'Screenplay': 'var(--spine-screenplay)',
  'Poem': 'var(--spine-poem)', 'Rap': 'var(--spine-rap)', 'Essay': 'var(--spine-essay)',
  'Memoir': 'var(--spine-memoir)', 'Newsletter Post': 'var(--spine-post)',
  'StagePlay': 'var(--spine-rap)', 'Song': 'var(--spine-rap)', 'Anthology': 'var(--spine-rap)',
};

// Town names ≤6 chars for the flap board
const FLAP_TOWNS = ['SCI-FI', 'HORROR', 'MAKING'];

export default async function HomePage() {
  const data = await getLibrary();

  // All dated items for heat grid
  const made = [
    ...data.stories.map(s => ({ d: s.d })),
    ...data.posts.map(p => ({ d: p.d })),
    ...data.tools.map(t => ({ d: t.d })),
    ...(data.projects || []).map(p => ({ d: p.d })),
  ].filter(m => m.d);

  // Count items per week key
  const byWeek = {};
  for (const m of made) {
    const [y, w] = wk(m.d);
    const k = `${y}-${w}`;
    byWeek[k] = (byWeek[k] || 0) + 1;
  }

  // Last 128 weeks as heat levels 0-4
  const today = new Date();
  const weekHeat = [];
  for (let i = 127; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    const [y, w] = wk(d.toISOString().slice(0, 10));
    weekHeat.push(Math.min(byWeek[`${y}-${w}`] || 0, 4));
  }

  // Story spines for Stacks arch (last 15 stories)
  const spines = data.stories.slice(0, 15).map(s => {
    const wc = s.wc || WC_DEFAULT[s.f] || 1500;
    return {
      c: FC[s.f] || 'var(--accent)',
      w: Math.max(12, Math.min(24, Math.round(wc / 160))),
      h: Math.max(40, Math.min(68, Math.round(42 + wc / 500))),
    };
  });

  const json = JSON.stringify({ weekHeat, spines }).replace(/</g, '\\u003c');

  return (
    <>
      <div className="home-wrap" id="home-wrap">
        <div className="home-stage" id="home-stage" aria-label="Library entrance">

          {/* ── Floor (filled by home.js) ── */}
          <div className="hs-floor" id="hs-floor" aria-hidden="true" />

          {/* ── Tiny figure ── */}
          <div className="hs-figure" aria-hidden="true">
            <div className="hs-fig-head" />
            <div className="hs-fig-body" />
          </div>

          {/* ── Stacks arch ── */}
          <a className="hs-arch hs-arch--stacks" href="/stacks" aria-label="Stacks — stories and essays">
            <div className="hs-spines" id="hs-spines" aria-hidden="true" />
          </a>
          <span className="hs-pill hs-pill--stacks" aria-hidden="true">Stacks</span>

          {/* ── Train arch ── */}
          <a className="hs-arch hs-arch--train" href="/train" aria-label="Train of thought">
            <div className="hs-rain" id="hs-rain" aria-hidden="true" />
            <div className="hs-board" id="hs-board" aria-hidden="true" />
          </a>
          <span className="hs-pill hs-pill--train" aria-hidden="true">Train of thought</span>

          {/* ── Lab arch ── */}
          <a className="hs-arch hs-arch--lab" href="/lab" aria-label="The Lab — projects and tools">
            <div className="hs-lab-tools" aria-hidden="true">
              <svg width="140" height="52" viewBox="0 0 140 52" fill="none" aria-hidden="true">
                {/* wrench */}
                <g fill="var(--scene-figure)" opacity=".7">
                  <rect x="4" y="8" width="6" height="28" rx="2"/>
                  <rect x="1" y="6" width="12" height="7" rx="2"/>
                  <rect x="1" y="29" width="12" height="7" rx="2"/>
                </g>
                {/* hammer */}
                <g fill="var(--scene-figure)" opacity=".7">
                  <rect x="38" y="12" width="5" height="30" rx="2"/>
                  <rect x="28" y="8" width="24" height="12" rx="2"/>
                </g>
                {/* screwdriver */}
                <g fill="var(--scene-figure)" opacity=".7">
                  <rect x="78" y="6" width="5" height="36" rx="2"/>
                  <rect x="76" y="38" width="9" height="8" rx="1"/>
                  <polygon points="78.5,46 83.5,46 81,52"/>
                </g>
                {/* ruler */}
                <g fill="var(--scene-figure)" opacity=".7">
                  <rect x="108" y="4" width="10" height="44" rx="2"/>
                  <rect x="108" y="10" width="5" height="2"/>
                  <rect x="108" y="17" width="7" height="2"/>
                  <rect x="108" y="24" width="5" height="2"/>
                  <rect x="108" y="31" width="7" height="2"/>
                  <rect x="108" y="38" width="5" height="2"/>
                </g>
              </svg>
            </div>
            <div className="hs-lab-plank" aria-hidden="true">
              <div className="hs-lab-obj hs-lab-obj--flask" />
              <div className="hs-lab-obj hs-lab-obj--gear" />
              <div className="hs-lab-obj hs-lab-obj--cube" />
            </div>
            <div className="hs-lab-drawers" aria-hidden="true">
              <div className="hs-lab-drawer" />
              <div className="hs-lab-drawer" />
            </div>
          </a>
          <span className="hs-pill hs-pill--lab" aria-hidden="true">The Lab</span>

          {/* ── Nook arch ── */}
          <a className="hs-arch hs-arch--nook" href="/nook" aria-label="Reading Nook">
            <div className="hs-nook-lamp" aria-hidden="true">
              <div className="hs-nook-shade" />
              <div className="hs-nook-bulb" />
              <div className="hs-nook-glow" />
              <div className="hs-nook-stem" />
              <div className="hs-nook-base" />
            </div>
            <div className="hs-nook-table" aria-hidden="true">
              <div className="hs-nook-book" />
            </div>
          </a>
          <span className="hs-pill hs-pill--nook" aria-hidden="true">Reading nook</span>

          {/* ── Tracker pill ── */}
          <a className="hs-tracker-pill" href="/tracker">Tracker</a>

        </div>
      </div>

      <script id="data" type="application/json" dangerouslySetInnerHTML={{ __html: json }} />
      <Script src="/home.js" strategy="afterInteractive" />
      {/* Redirect old hash links to /stacks */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){var h=location.hash;if(!h)return;var t=h.slice(1);var tabs=['writing','stories','tools','projects','bookshelf'];if(tabs.indexOf(t)>=0||/^[sptxb]-/.test(t))location.replace('/stacks'+h);})();` }} />
    </>
  );
}
