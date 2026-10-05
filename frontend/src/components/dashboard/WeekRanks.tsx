'use client';

// "최근 7일 하루 순위" — 날짜별 메달 7개를 한 줄로

import { WEEKDAYS } from '@/lib/format';
import type { PeerStat } from '@/lib/types';
import { Medal } from './DashIcons';
import { TIER_COLOR, standing, tierOf } from './rank';

export default function WeekRanks({ peers, dates }: { peers: PeerStat[]; dates: string[] }) {
  const items = dates.map((d) => {
    const st = standing(peers, [d], 'study');
    const studied = !!st && st.mine >= 1;
    const dt = new Date(d + 'T00:00:00');
    return {
      d,
      label: WEEKDAYS[dt.getDay()],
      sub: `${dt.getMonth() + 1}/${dt.getDate()}`,
      rank: studied ? st.rank : null,
      color: studied ? TIER_COLOR[tierOf(st.topPct)] : '#334155',
    };
  });
  const ranked = items.filter((i) => i.rank !== null);
  const best = ranked.length ? Math.min(...ranked.map((i) => i.rank!)) : null;

  return (
    <div className="dash-card">
      <div className="card-head">
        <span>최근 7일 하루 순위</span>
        {best !== null && <span className="card-note">최고 {best}등</span>}
      </div>
      <div className="week-ranks">
        {items.map((i, idx) => (
          <div className={`wr${idx === items.length - 1 ? ' today' : ''}`} key={i.d} title={i.rank ? `${i.sub} ${i.rank}등` : `${i.sub} 기록 없음`}>
            <Medal rank={i.rank} color={i.color} size={30} />
            <span className="wr-day">{idx === items.length - 1 ? '오늘' : i.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
