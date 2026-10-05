'use client';

// ── 소개 페이지 본문 ──
// 스크롤을 따라 읽는 스토리 구성.
// 문구/구성은 src/data/about.json 에서 관리하고, 여기서는 배치만 합니다.
// 일러스트는 illustrations.tsx 의 커스텀 SVG (art 키로 연결).

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import content from '@/data/about.json';
import { hl } from './Highlight';
import OverviewMap from './OverviewMap';
import {
  FakeStudyArt,
  FlowArt,
  HeroArt,
  HeroKeyArt,
  HeroKeyArtNarrow,
  PrivacyArt,
  RaceArt,
  ReportArt,
  RhythmArt,
  VisionArt,
} from './illustrations';
import type { AboutContent, ArtKey, Block, Cta, FoldItem, PipelineStatus } from './types';

const { hero, stages, outro, nav } = content as unknown as AboutContent;

const ART: Record<ArtKey, () => React.ReactElement> = {
  overview: OverviewMap,
  heroKey: HeroKeyArt,
  hero: HeroArt,
  fakeStudy: FakeStudyArt,
  rhythm: RhythmArt,
  vision: VisionArt,
  race: RaceArt,
  flow: FlowArt,
  report: ReportArt,
  privacy: PrivacyArt,
};

const STATUS_LABEL: Record<PipelineStatus, string> = {
  web: '웹 · 지금 동작',
  app: '모바일 · ML Kit',
  both: '웹 + 모바일',
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

/** 펼친 내용: 문단 + 점 목록 */
function FoldBody({ body, points }: { body?: string; points?: string[] }) {
  return (
    <>
      {body && <p className="fold-text">{hl(body)}</p>}
      {points && points.length > 0 && (
        <ul className="fold-points">
          {points.map((pt) => (
            <li key={pt}>{hl(pt)}</li>
          ))}
        </ul>
      )}
    </>
  );
}

/** 요약 한 줄 → 눌러서 세부 설명. 네이티브 <details> 라 키보드·스크린리더로도 열립니다 */
function Fold({ item }: { item: FoldItem }) {
  return (
    <details className="fold">
      <summary>
        {item.icon && (
          <span className="fold-icon" aria-hidden>
            {item.icon}
          </span>
        )}
        <span className="fold-head">
          <strong>{item.title}</strong>
          <span className="fold-sum">{hl(item.summary)}</span>
        </span>
        <span className="fold-chev" aria-hidden />
      </summary>
      <div className="fold-body">
        <FoldBody body={item.body} points={item.points} />
      </div>
    </details>
  );
}

/** 스테이지 안의 접이식 항목을 한 번에 열고 닫습니다 */
function FoldAll() {
  const ref = useRef<HTMLButtonElement>(null);
  const [allOpen, setAllOpen] = useState(false);

  useEffect(() => {
    const stage = ref.current?.closest('.stage');
    if (!stage) return;
    // 하나씩 열고 닫아도 버튼 문구가 맞도록 toggle 이벤트(버블 안 됨)를 캡처로 받습니다
    const sync = () => {
      const all = Array.from(stage.querySelectorAll('details'));
      setAllOpen(all.length > 0 && all.every((d) => d.open));
    };
    stage.addEventListener('toggle', sync, true);
    return () => stage.removeEventListener('toggle', sync, true);
  }, []);

  const toggle = () => {
    const stage = ref.current?.closest('.stage');
    stage?.querySelectorAll('details').forEach((d) => {
      d.open = !allOpen;
    });
  };

  return (
    <button ref={ref} type="button" className="fold-all" onClick={toggle} aria-pressed={allOpen}>
      {allOpen ? '세부 설명 모두 접기' : '세부 설명 모두 펼치기'}
      <span className={`fold-chev${allOpen ? ' up' : ''}`} aria-hidden />
    </button>
  );
}

const hasFolds = (blocks: Block[]) =>
  blocks.some(
    (b) =>
      b.type === 'pipeline' ||
      b.type === 'accordion' ||
      (b.type === 'definitions' && b.items.some((it) => it.points?.length)),
  );

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
          {block.items.map((it) =>
            it.points?.length ? (
              <li key={it.term} className="has-fold">
                <details className="fold plain">
                  <summary>
                    <span className="fold-head">
                      <strong>{it.term}</strong>
                      <span className="fold-sum">{hl(it.desc)}</span>
                    </span>
                    <span className="fold-chev" aria-hidden />
                  </summary>
                  <div className="fold-body">
                    <FoldBody points={it.points} />
                  </div>
                </details>
              </li>
            ) : (
              <li key={it.term}>
                <strong>{it.term}</strong>
                <span>{hl(it.desc)}</span>
              </li>
            ),
          )}
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
    case 'pipeline':
      return (
        <ol className="pipeline">
          {block.items.map((it, i) => (
            <li key={it.title} className={it.status}>
              <details className="fold plain">
                <summary>
                  <span className="pl-icon" aria-hidden>
                    {it.icon}
                  </span>
                  <span className="pl-body">
                    <span className="pl-head">
                      <span className="pl-n">{String(i + 1).padStart(2, '0')}</span>
                      <strong>{it.title}</strong>
                      <span className={`pl-status ${it.status}`}>{STATUS_LABEL[it.status]}</span>
                    </span>
                    <span className="fold-sum">{hl(it.summary)}</span>
                  </span>
                  <span className="fold-chev" aria-hidden />
                </summary>
                <div className="fold-body pl-more">
                  <code className="pl-api">{it.api}</code>
                  <p className="pl-desc">{hl(it.desc)}</p>
                  <FoldBody points={it.points} />
                </div>
              </details>
            </li>
          ))}
        </ol>
      );
    case 'statement':
      return (
        <div className="statement">
          <span className="label">{block.label}</span>
          {block.lines.map((line) => (
            <p key={line}>{hl(line)}</p>
          ))}
        </div>
      );
    case 'accordion':
      return (
        <>
          {block.title && <p className="fake-title">{hl(block.title)}</p>}
          <div className="folds">
            {block.items.map((it) => (
              <Fold key={it.title} item={it} />
            ))}
          </div>
        </>
      );
    case 'tiles':
      return (
        <>
          {block.title && <p className="fake-title">{hl(block.title)}</p>}
          <ul className="tiles">
            {block.items.map((it) => (
              <li key={it.title}>
                <span className="tile-icon" aria-hidden>
                  {it.icon}
                </span>
                <strong>{it.title}</strong>
                <span>{hl(it.desc)}</span>
              </li>
            ))}
          </ul>
        </>
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
  const chipsRef = useRef<HTMLDivElement>(null);
  const [moreRight, setMoreRight] = useState(false);

  // 칩이 넘치는 화면에서는 현재 스테이지 칩이 보이도록 가로 스크롤을 맞추고, 오른쪽에 더 있으면 표시합니다
  useEffect(() => {
    const box = chipsRef.current;
    if (!box) return;
    const on = box.querySelector<HTMLElement>('a.on');
    if (on) {
      const left = on.offsetLeft - box.offsetLeft;
      if (left < box.scrollLeft || left + on.offsetWidth > box.scrollLeft + box.clientWidth) {
        box.scrollTo({ left: left - box.clientWidth / 2 + on.offsetWidth / 2, behavior: 'smooth' });
      }
    }
  }, [active]);

  useEffect(() => {
    const box = chipsRef.current;
    if (!box) return;
    const sync = () => setMoreRight(box.scrollLeft + box.clientWidth < box.scrollWidth - 4);
    sync();
    box.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      box.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, []);

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
          <div ref={chipsRef} className={`stage-nav-chips${moreRight ? ' more-right' : ''}`}>
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
        const Art = s.art ? ART[s.art] : null;
        return (
          <section className="stage" id={s.id} key={s.id}>
            <div className="stage-inner reveal">
              <p className="stage-kicker">
                <span className="num">STAGE {String(i + 1).padStart(2, '0')}</span>
                {s.kicker}
              </p>
              <h2>
                {s.title.map((line) => (
                  <span key={line}>{hl(line)}</span>
                ))}
              </h2>
              {s.summary && (
                <div className="stage-summary">
                  <span className="label">핵심 요약</span>
                  <ul>
                    {s.summary.map((line) => (
                      <li key={line}>{hl(line)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="stage-lead">{hl(s.lead)}</p>
              {Art && (
                <div className="stage-art">
                  <Art />
                </div>
              )}
              {hasFolds(s.blocks) && <FoldAll />}
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
