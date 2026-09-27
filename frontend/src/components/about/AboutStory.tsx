'use client';

// ── 소개 페이지 본문 ──
// 스크롤을 따라 읽는 스토리 구성.
// 문구/구성은 src/data/about.json 에서 관리하고, 여기서는 배치만 합니다.
// 일러스트는 illustrations.tsx 의 커스텀 SVG (art 키로 연결).

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import content from '@/data/about.json';
import { hl } from './Highlight';
import {
  FakeStudyArt,
  FlowArt,
  HeroArt,
  HeroKeyArt,
  HeroKeyArtNarrow,
  PrivacyArt,
  ReportArt,
  RhythmArt,
  WebcamArt,
} from './illustrations';
import type { AboutContent, ArtKey, Block, Cta } from './types';

const { hero, stages, outro, nav } = content as unknown as AboutContent;

const ART: Record<ArtKey, () => React.ReactElement> = {
  heroKey: HeroKeyArt,
  hero: HeroArt,
  fakeStudy: FakeStudyArt,
  rhythm: RhythmArt,
  webcam: WebcamArt,
  flow: FlowArt,
  report: ReportArt,
  privacy: PrivacyArt,
};

function CtaLinks({ items }: { items: Cta[] }) {
  return (
    <div className="hero-cta">
      {items.map((c) => (
        <Link key={c.href + c.label} href={c.href} className={`btn-${c.variant}`}>
          {c.label}
        </Link>
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return <p className="fake-title">{hl(block.text)}</p>;
    case 'caption':
      return <p className="fake-caption">{hl(block.text)}</p>;
    case 'note':
      return <p className="note">{hl(block.text)}</p>;
    case 'checklist':
      return (
        <ul className="fake-list">
          {block.items.map((it) => (
            <li key={it.text}>
              <span aria-hidden>{it.icon}</span>
              {hl(it.text)}
            </li>
          ))}
        </ul>
      );
    case 'compare':
      return (
        <ul className="gap-table">
          {block.items.map((it) => (
            <li key={it.me}>
              <span className="me">{it.me}</span>
              <span className="arrow" aria-hidden>
                →
              </span>
              <span className="real">{hl(it.real)}</span>
            </li>
          ))}
        </ul>
      );
    case 'definitions':
      return (
        <ul className="rhythm-list">
          {block.items.map((it) => (
            <li key={it.term}>
              <strong>{it.term}</strong>
              <span>{hl(it.desc)}</span>
            </li>
          ))}
        </ul>
      );
    case 'steps':
      return (
        <ol className="steps">
          {block.items.map((it, i) => (
            <li key={it.title}>
              <span className="n">{String(i + 1).padStart(2, '0')}</span>
              <span className="t">{it.title}</span>
              <span className="d">{hl(it.desc)}</span>
            </li>
          ))}
        </ol>
      );
    case 'callout':
      return (
        <div className="shot-callout">
          <span className="shot-icon" aria-hidden>
            {block.icon}
          </span>
          <div>
            <strong>{hl(block.title)}</strong>
            <span>{hl(block.text)}</span>
          </div>
        </div>
      );
  }
}

const HeroArtComp = ART[hero.art];
/** 좁은 화면에서 글자가 뭉개지지 않도록 세로 배치 버전을 따로 둡니다 */
const HERO_ART_NARROW: Partial<Record<ArtKey, () => React.ReactElement>> = {
  heroKey: HeroKeyArtNarrow,
};
const HeroArtNarrowComp = HERO_ART_NARROW[hero.art];

export default function AboutStory() {
  const [active, setActive] = useState(stages[0].id);
  const [stuck, setStuck] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // ── 스크롤에 따라 현재 스테이지 표시 + 등장 애니메이션 ──
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll<HTMLElement>('.stage'));

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    const reveal = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            reveal.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );

    // 스테이지 내비가 상단에 고정됐는지 (바로 위 센티넬이 화면 밖으로 나가면 고정 상태)
    const pin = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    if (sentinelRef.current) pin.observe(sentinelRef.current);

    sections.forEach((s) => spy.observe(s));
    root.querySelectorAll('.reveal').forEach((el) => reveal.observe(el));
    return () => {
      spy.disconnect();
      reveal.disconnect();
      pin.disconnect();
    };
  }, []);

  return (
    <div className="about" ref={rootRef}>
      <div className="about-bg" aria-hidden />

      {/* ── 히어로 ── */}
      <header className="about-hero">
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1>
          {hero.title.map((line, i) => (
            <span key={line} className={i === hero.accentLine ? 'em' : undefined}>
              {line}
            </span>
          ))}
        </h1>
        <p className="sub">
          {hero.sub.map((line, i) => (
            <span key={line}>
              {i > 0 && <br />}
              {hl(line)}
            </span>
          ))}
        </p>
        <CtaLinks items={hero.ctas} />
        <div className="hero-chips">
          {hero.chips.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <div className="hero-art">
          <div className="wide">
            <HeroArtComp />
          </div>
          {HeroArtNarrowComp && (
            <div className="narrow">
              <HeroArtNarrowComp />
            </div>
          )}
        </div>
        <div className="scroll-hint" aria-hidden>
          <span className="line" />
          {hero.scrollHint}
        </div>
      </header>

      {/* ── 스테이지 내비 ── */}
      <div ref={sentinelRef} className="stage-nav-sentinel" aria-hidden />
      <nav className={`stage-nav${stuck ? ' stuck' : ''}`} aria-label={nav.label}>
        <div className="stage-nav-inner">
          <div className="stage-nav-chips">
            {stages.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={active === s.id ? 'on' : undefined}
                aria-current={active === s.id ? 'true' : undefined}
              >
                <b>{String(i + 1).padStart(2, '0')}</b>
                {s.nav}
              </a>
            ))}
          </div>
          <Link href={nav.cta.href} className="stage-nav-cta">
            <span className="dot" aria-hidden />
            {nav.cta.label}
            <span className="arrow" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </nav>

      {/* ── 스토리 ── */}
      {stages.map((s, i) => {
        const Art = ART[s.art];
        return (
          <section className="stage" id={s.id} key={s.id}>
            <div className="stage-inner reveal">
              <p className="stage-kicker">
                <span className="num">STAGE {String(i + 1).padStart(2, '0')}</span>
                {s.kicker}
              </p>
              <h2>
                {s.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h2>
              <p className="stage-lead">{hl(s.lead)}</p>
              <div className="stage-art">
                <Art />
              </div>
              {s.blocks.map((b, bi) => (
                <BlockView key={bi} block={b} />
              ))}
            </div>
          </section>
        );
      })}

      {/* ── 마무리 ── */}
      <section className="about-outro reveal">
        <h2>{outro.heading}</h2>
        <p className="outro-em">{outro.em}</p>
        <p className="outro-sub">{hl(outro.sub)}</p>
        <CtaLinks items={outro.ctas} />
        <p className="outro-foot">{outro.foot}</p>
      </section>
    </div>
  );
}
