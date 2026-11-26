export default function Home() {
  return (
    <>
      <main className="band" style={{ maxWidth: 480 }}>
        <h1>Mohammad Khan · Library</h1>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <li><a href="/tracker" style={{ color: 'var(--text)', textDecoration: 'none', fontFamily: "'Josefin Sans', sans-serif", fontSize: 15, letterSpacing: '.03em' }}>Tracker — build stats &amp; charts</a></li>
            <li><a href="/stacks" style={{ color: 'var(--text)', textDecoration: 'none', fontFamily: "'Josefin Sans', sans-serif", fontSize: 15, letterSpacing: '.03em' }}>Stacks — stories, essays, tools, projects, bookshelf</a></li>
            <li><a href="/train" style={{ color: 'var(--text)', textDecoration: 'none', fontFamily: "'Josefin Sans', sans-serif", fontSize: 15, letterSpacing: '.03em' }}>Train of thought</a></li>
            <li>
              <span
                aria-disabled="true"
                style={{ color: 'var(--muted)', fontFamily: "'Josefin Sans', sans-serif", fontSize: 15, letterSpacing: '.03em', cursor: 'default' }}
              >
                The Lab — coming soon
              </span>
            </li>
            <li><a href="/nook" style={{ color: 'var(--text)', textDecoration: 'none', fontFamily: "'Josefin Sans', sans-serif", fontSize: 15, letterSpacing: '.03em' }}>Reading Nook</a></li>
          </ul>
        </nav>
      </main>
      {/* Redirect old hash links (#stories, #writing, #tools, #projects, #bookshelf, item anchors) to /stacks */}
      <script dangerouslySetInnerHTML={{ __html: `(function(){var h=location.hash;if(!h)return;var t=h.slice(1);var tabs=['writing','stories','tools','projects','bookshelf'];if(tabs.indexOf(t)>=0||/^[sptxb]-/.test(t))location.replace('/stacks'+h);})();` }} />
    </>
  );
}
