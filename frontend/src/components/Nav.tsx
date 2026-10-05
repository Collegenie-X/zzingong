'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const LINKS = [
  { href: '/dashboard', label: '대시보드' },
  { href: '/data', label: '데이터' },
  { href: '/about', label: '소개' },
];

export default function Nav() {
  const pathname = usePathname();
  const onTimer = pathname === '/';
  const ref = useRef<HTMLElement>(null);

  // 모바일에서 학생 바가 네비 바로 아래에 붙도록 네비 높이를 CSS 변수(--nav-h)로 알려 줍니다
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <nav className="top-nav" ref={ref}>
      <Link href="/" className="logo" aria-label="ZZINGONG AI 홈">
        <Image
          src="/brand/logo-horizontal-dark.svg"
          alt="ZZINGONG AI"
          width={572}
          height={96}
          priority
        />
      </Link>
      <div className="nav-links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={pathname === l.href ? 'active' : ''}>
            {l.label}
          </Link>
        ))}
        {/* 타이머는 이 서비스의 본 화면이라 링크 대신 버튼으로 강조 */}
        <Link
          href="/"
          className={`nav-cta${onTimer ? ' current' : ''}`}
          aria-current={onTimer ? 'page' : undefined}
        >
          <span className="dot" aria-hidden />
          {onTimer ? '타이머' : '타이머 시작'}
          {!onTimer && (
            <span className="arrow" aria-hidden>
              →
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
}
