'use client';

// 맨 위 "반 N명 중 나의 순위" 카드: 캐릭터 표정 + 큰 순위 + 반 전체 점 분포

import { Hero, type Mood } from '@/components/game/GameIcons';
import { fmtMinKorean } from '@/lib/format';
import { PeerStrip } from './DashIcons';
import { TIER_COLOR, tierOf, type Standing, type Tier } from './rank';

const MOOD: Record<Tier, Mood> = { gold: 'fire', good: 'strong', mid: 'sprout', low: 'dizzy' };
const TIER_LABEL: Record<Tier, string> = { gold: '최상위권', good: '상위권', mid: '중위권', low: '분발 필요' };

export default function RankHero({ st, periodLabel, days }: { st: Standing; periodLabel: string; days: number }) {
  const tier = tierOf(st.topPct);
  const color = TIER_COLOR[tier];
  const diff = Math.round(st.mine - st.avg);
  const mood: Mood = st.mine < 1 ? 'sleepy' : MOOD[tier];
  const perDay = st.toNext !== null ? Math.max(1, Math.ceil(st.toNext / days)) : 0;

  return (
    <div className="dash-card rank-hero" style={{ '--tc': color } as React.CSSProperties}>
      <div className="rh-top">
        <Hero mood={mood} size={58} />
        <div className="rh-main">
          <div className="rh-cap">{periodLabel} 순공 · 반 {st.size}명 중</div>
          <div className="rh-rank">
            <b>{st.rank}</b>등
            <span className="rh-chip">상위 {st.topPct}% · {TIER_LABEL[tier]}</span>
          </div>
        </div>
      </div>

      <div className="rh-strip">
        <PeerStrip values={st.values} mine={st.mine} avg={st.avg} color={color} big />
        <div className="rh-axis"><span>적게</span><span>많이 →</span></div>
      </div>

      <div className="rh-facts">
        <span>나 <b>{fmtMinKorean(st.mine)}</b></span>
        <span>평균 대비 <b className={diff >= 0 ? 'up' : 'dn'}>{diff >= 0 ? '+' : ''}{fmtMinKorean(diff)}</b></span>
        <span>
          {st.toNext === null ? (
            <b className="up">반 1등!</b>
          ) : (
            <>{st.rank - 1}등까지 <b>하루 +{perDay}분</b></>
          )}
        </span>
      </div>
    </div>
  );
}
