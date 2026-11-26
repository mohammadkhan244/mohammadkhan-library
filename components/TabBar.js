'use client';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Home',   href: '/' },
  { label: 'Stacks', href: '/stacks' },
  { label: 'Train',  href: '/train' },
  { label: 'Lab',    href: '/lab' },
  { label: 'Nook',   href: '/nook' },
];

export default function TabBar() {
  const path = usePathname();
  return (
    <nav className="lib-tabs" aria-label="Site navigation">
      {TABS.map(({ label, href }) => {
        if (!href) {
          return (
            <span key={label} className="lib-tab lib-tab--disabled" aria-disabled="true">
              {label}
            </span>
          );
        }
        const active = href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
        return (
          <a
            key={label}
            href={href}
            className={'lib-tab' + (active ? ' lib-tab--active' : '')}
            aria-current={active ? 'page' : undefined}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
