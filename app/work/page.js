// ── URLs — fill in before launch ─────────────────────────────
const LINKEDIN_URL = 'https://www.linkedin.com/in/mohammadukhan/';
const SUBSTACK_URL = 'https://mohammadkhan.substack.com/';

export const metadata = {
  title: 'Work with me · Mohammad Khan',
  description: "Have an interesting problem? I'd love to explore what we could figure out together.",
};

export default function WorkPage() {
  return (
    <main className="work-page">
      <h1 className="work-h1">Have an interesting problem?</h1>
      <p className="work-sub">
        I&apos;d love to explore what we could figure out together.
      </p>
      <div className="work-actions">
        <a
          href={LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fd-btn-primary"
        >
          LinkedIn →
        </a>
        <a
          href={SUBSTACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="fd-btn-outlined"
        >
          Substack →
        </a>
      </div>
    </main>
  );
}
