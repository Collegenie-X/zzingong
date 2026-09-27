// 트위터(Twemoji) 이모지 — 기기별로 모양이 달라지지 않도록 SVG 를 직접 씁니다.
// 에셋: public/twemoji (CC-BY 4.0, https://github.com/jdecked/twemoji)

const CODES: Record<string, string> = {
  '🔥': '1f525',
  '💪': '1f4aa',
  '🎯': '1f3af',
  '🌱': '1f331',
  '😴': '1f634',
  '🌙': '1f319',
};

interface Props {
  char: keyof typeof CODES | string;
  /** 스크린리더·툴팁용 설명 */
  label: string;
  size?: number;
  className?: string;
}

export default function Twemoji({ char, label, size = 20, className }: Props) {
  const code = CODES[char];
  if (!code) return <span className={className} role="img" aria-label={label}>{char}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 최적화가 필요 없는 고정 크기 SVG
    <img
      className={className}
      src={`/twemoji/${code}.svg`}
      alt={char}
      title={label}
      width={size}
      height={size}
      draggable={false}
    />
  );
}
