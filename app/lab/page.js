import Script from 'next/script';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getLibrary } from '../../lib/notion';

export const revalidate = 3600;

export const metadata = {
  title: 'The Lab · Mohammad Khan',
  description: 'Projects and tools — software, engineering, humanitarian work, filmmaking and more.',
};

export default async function LabPage() {
  const projects = JSON.parse(readFileSync(join(process.cwd(), 'lib', 'projects.json'), 'utf8'));
  const { tools } = await getLibrary();

  const json = JSON.stringify({ projects, tools }).replace(/</g, '\\u003c');

  return (
    <>
      <div className="lab-wrap" id="lab-wrap">
        <div className="lab-stage" id="lab-stage" aria-label="The Lab — projects and tools">

          {/* ── Back pill ── */}
          <a className="lab-back" href="/">← Library</a>

          {/* ── Title ── */}
          <div className="lab-title-block">
            <div className="lab-h1">The Lab</div>
            <div className="lab-sub">PROJECTS &amp; TOOLS</div>
          </div>

          {/* ── Pegboard (tools — filled by lab.js) ── */}
          <div className="lab-pegboard" id="lab-pegboard" aria-label="Tools" />

          {/* ── Bench plank ── */}
          <div className="lab-bench-plank" aria-hidden="true" />

          {/* ── Ongoing objects above bench (filled by lab.js) ── */}
          <div className="lab-ongoing-row" id="lab-ongoing" aria-label="Ongoing projects" />

          {/* ── Cabinet with drawers (filled by lab.js) ── */}
          <div className="lab-cabinet" id="lab-cabinet" aria-label="Projects by category" />

          {/* ── Detail panel (filled + shown by lab.js) ── */}
          <div className="lab-panel" id="lab-panel" role="dialog" aria-modal="true"
               aria-label="Project details" hidden>
            <button className="lab-panel-close" id="lab-panel-close" aria-label="Close">×</button>
            <div className="lab-panel-inner" id="lab-panel-inner" />
          </div>

        </div>
      </div>

      <div className="lab-toast" id="lab-toast" role="status" aria-live="polite" />

      <script id="data" type="application/json" dangerouslySetInnerHTML={{ __html: json }} />
      <Script src="/lab.js" strategy="afterInteractive" />
    </>
  );
}
