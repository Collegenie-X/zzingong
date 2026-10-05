'use client';

// "코치 한마디" — 순위를 올리려면 무엇을 해야 하는지 한 줄씩

import { TipIcon, type TipKind } from './DashIcons';
import type { StandingRow } from './StandingList';

interface Props {
  total: StandingRow;
  subjects: StandingRow[];
  days: number;
}

export default function CoachTips({ total, subjects, days }: Props) {
  const tips: { kind: TipKind; text: React.ReactNode }[] = [];
  const perDay = (gap: number) => Math.max(1, Math.ceil(gap / days));

  const t = total.st;
  if (t.toNext === null) {
    tips.push({ kind: 'star', text: <>반 <b>1등</b>입니다. 지금 페이스만 지키면 돼요!</> });
  } else {
    tips.push({ kind: 'up', text: <>하루 <b>{perDay(t.toNext)}분</b>만 더 하면 <b>{t.rank - 1}등</b>으로 올라가요</> });
  }

  if (subjects.length) {
    const sorted = [...subjects].sort((a, b) => a.st.topPct - b.st.topPct);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    if (worst !== best && worst.st.mine < worst.st.avg) {
      const gap = worst.st.avg - worst.st.mine;
      tips.push({
        kind: 'warn',
        text: <><b style={{ color: worst.color }}>{worst.label}</b> {worst.st.rank}등 — 하루 <b>{perDay(gap)}분</b> 더하면 반 평균</>,
      });
    }
    if (best.st.mine >= 1) {
      tips.push({ kind: 'star', text: <><b style={{ color: best.color }}>{best.label}</b> 반 {best.st.rank}등, 가장 강한 과목이에요</> });
    }
  }

  return (
    <div className="dash-card">
      <div className="card-head"><span>코치 한마디</span></div>
      {tips.map((tip, i) => (
        <div className="tip-row" key={i}>
          <TipIcon kind={tip.kind} />
          <span>{tip.text}</span>
        </div>
      ))}
    </div>
  );
}
