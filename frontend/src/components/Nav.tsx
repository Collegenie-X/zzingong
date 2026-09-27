'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: '타이머' },
  { href: '/dashboard', label: '대시보드' },
  { href: '/data', label: '데이터' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav className="top-nav">
      <div className="logo">AI 공부 매니저</div>
      <div className="nav-links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={pathname === l.href ? 'active' : ''}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
