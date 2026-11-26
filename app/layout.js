import './theme.css';
import './globals.css';
import TabBar from '../components/TabBar';

export const metadata = {
  metadataBase: new URL('https://mohammadkhan-library.vercel.app'),
  title: 'Mohammad Khan · Library',
  description: 'Fiction, essays, tools and projects. One story a week since 2020.',
  twitter: { card: 'summary_large_image' },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* No-flash theme: set data-theme before any paint */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Gilda+Display&family=Josefin+Sans:wght@400;600&family=Lato:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="lib-header">
          <a href="/" className="lib-logo">
            <span className="lib-name">Mohammad Khan</span>
            <span className="lib-label">Library</span>
          </a>
        </header>
        {children}
        <TabBar />
      </body>
    </html>
  );
}
