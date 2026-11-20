import { getLibrary } from '../../lib/notion';

export const revalidate = 3600;

export const metadata = {
  title: 'Stream · Mohammad Khan',
  description: 'Everything I\'ve made — stories, newsletter posts, tools and projects — in reverse chronological order.',
};

const KIND_LABEL = { Story: 'Story', Newsletter: 'Newsletter', Product: 'Product', Project: 'Project' };
const KIND_COLOR = { Story: '#3a6ff7', Newsletter: '#e0569b', Product: '#8b5cf6', Project: '#f08a24' };

function fmtDate(d) {
  if (!d) return '';
  const x = new Date(d.length > 7 ? d + 'T12:00' : d + '-15T12:00');
  return x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function Stream() {
  const data = await getLibrary();

  const items = [
    ...data.stories.map(s => ({
      kind: 'Story',
      title: (s.w ? `Week ${s.w}: ` : '') + s.t,
      date: s.d,
      url: s.url || '',
      note: [s.f, ...(s.g || []).filter(g => g !== s.f)].filter(Boolean).slice(0, 2).join(' · '),
    })),
    ...data.posts.map(p => ({
      kind: 'Newsletter',
      title: p.t,
      date: p.d,
      url: p.url || '',
      note: '',
    })),
    ...data.tools.map(t => ({
      kind: 'Product',
      title: t.t,
      date: t.d,
      url: t.url || '',
      note: [t.ty, t.st].filter(Boolean).join(' · '),
    })),
    ...data.projects.map(p => ({
      kind: 'Project',
      title: p.t,
      date: p.d,
      url: p.links[0]?.[1] || '',
      note: p.cat,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  let lastYear = '';

  return (
    <>
      <header className="band">
        <h1>Stream</h1>
        <p style={{ color: 'var(--mute)', margin: '8px 0 0', maxWidth: '58ch' }}>
          Everything I&apos;ve made — {items.length} items — in reverse chronological order.
        </p>
      </header>
      <nav>
        <div className="in">
          <a href="/">← Library</a>
        </div>
      </nav>
      <main className="band" style={{ paddingTop: 0 }}>
        <table className="stream-table">
          <tbody>
            {items.map((item, i) => {
              const yr = item.date.slice(0, 4);
              const showYear = yr !== lastYear;
              lastYear = yr;
              const inner = (
                <tr key={i} className="stream-row">
                  <td className="stream-yr">{showYear ? yr : ''}</td>
                  <td className="stream-date">{fmtDate(item.date)}</td>
                  <td className="stream-kind">
                    <span className="stream-badge" style={{ background: KIND_COLOR[item.kind] + '22', color: KIND_COLOR[item.kind] }}>
                      {KIND_LABEL[item.kind]}
                    </span>
                  </td>
                  <td className="stream-title">
                    {item.url
                      ? <a href={item.url}>{item.title}</a>
                      : item.title}
                    {item.note ? <span className="stream-note">{item.note}</span> : null}
                  </td>
                </tr>
              );
              return inner;
            })}
          </tbody>
        </table>
      </main>
      <footer className="band" style={{ color: 'var(--mute)', fontSize: '13px', borderTop: '1px solid var(--line)' }}>
        {data.live ? '' : 'Snapshot — live sync starts once NOTION_TOKEN is set.'}
      </footer>
      <style>{`
        .stream-table{width:100%;border-collapse:collapse;font-size:15px}
        .stream-row td{padding:9px 8px;border-bottom:1px solid var(--line);vertical-align:top}
        .stream-yr{font-size:13px;color:var(--mute);font-variant-numeric:tabular-nums;white-space:nowrap;width:3.5em;font-weight:600}
        .stream-date{font-size:13px;color:var(--mute);white-space:nowrap;width:7em}
        .stream-kind{white-space:nowrap;width:7em}
        .stream-badge{display:inline-block;font-size:12px;font-weight:500;padding:2px 7px;border-radius:4px}
        .stream-title a{color:var(--ink);text-decoration:none;font-weight:500}.stream-title a:hover{text-decoration:underline}
        .stream-note{display:block;font-size:13px;color:var(--mute);margin-top:2px}
        @media(max-width:600px){.stream-date,.stream-yr{display:none}.stream-kind{width:5em}}
      `}</style>
    </>
  );
}
