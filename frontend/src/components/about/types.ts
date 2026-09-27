// ── 소개 페이지 콘텐츠(src/data/about.json) 타입 ──

export type ArtKey = 'heroKey' | 'hero' | 'fakeStudy' | 'rhythm' | 'webcam' | 'flow' | 'report' | 'privacy';

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'caption'; text: string }
  | { type: 'note'; text: string }
  | { type: 'checklist'; items: { icon: string; text: string }[] }
  | { type: 'compare'; items: { me: string; real: string }[] }
  | { type: 'definitions'; items: { term: string; desc: string }[] }
  | { type: 'steps'; items: { title: string; desc: string }[] }
  | { type: 'callout'; icon: string; title: string; text: string };

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
  lead: string;
  art: ArtKey;
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
