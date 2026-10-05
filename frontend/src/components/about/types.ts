// ── 소개 페이지 콘텐츠(src/data/about.json) 타입 ──

export type ArtKey =
  | 'overview'
  | 'heroKey'
  | 'hero'
  | 'fakeStudy'
  | 'rhythm'
  | 'vision'
  | 'race'
  | 'flow'
  | 'report'
  | 'privacy';

/** 감지 단계가 어디서 동작하는지: 웹(지금) / 모바일 앱(ML Kit) / 둘 다 */
export type PipelineStatus = 'web' | 'app' | 'both';

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'caption'; text: string }
  | { type: 'note'; text: string }
  | { type: 'checklist'; items: { icon: string; text: string }[] }
  | { type: 'compare'; items: { me: string; real: string }[] }
  | { type: 'definitions'; items: { term: string; desc: string; points?: string[] }[] }
  | { type: 'steps'; items: { title: string; desc: string }[] }
  | { type: 'callout'; icon: string; title: string; text: string }
  | {
      type: 'pipeline';
      items: {
        icon: string;
        title: string;
        /** 접힌 상태에서 보이는 한 줄 요약 */
        summary: string;
        api: string;
        desc: string;
        status: PipelineStatus;
        /** 펼쳤을 때 보이는 세부 설명 */
        points?: string[];
      }[];
    }
  | { type: 'accordion'; title?: string; items: FoldItem[] }
  /** 큰 글씨 결론 문장 (줄마다 한 줄씩) */
  | { type: 'statement'; label: string; lines: string[] }
  | { type: 'tiles'; title?: string; items: { icon: string; title: string; desc: string }[] };

/** 열고 닫는 항목: 접혀 있으면 summary 만, 펼치면 body + points */
export interface FoldItem {
  icon?: string;
  title: string;
  summary: string;
  body?: string;
  points?: string[];
}

export interface Cta {
  label: string;
  href: string;
  variant: 'primary' | 'ghost';
}

export interface Stage {
  id: string;
  nav: string;
  kicker: string;
  title: string[];
  /** 제목 아래 "핵심 요약" 상자 (2~3줄) */
  summary?: string[];
  lead: string;
  /** 일러스트가 없는 스테이지(결론 등)는 생략 */
  art?: ArtKey;
  blocks: Block[];
}

export interface AboutContent {
  hero: {
    eyebrow: string;
    title: string[];
    accentLine: number;
    sub: string[];
    ctas: Cta[];
    chips: string[];
    art: ArtKey;
    scrollHint: string;
  };
  stages: Stage[];
  outro: { heading: string; em: string; sub: string; ctas: Cta[]; foot: string };
  nav: { label: string; cta: { label: string; href: string } };
}
