// 반 친구들과 비교한 "나의 위치" 계산 헬퍼
// 모든 값은 peers(반 전체 학생 익명 기록)에서 직접 계산하므로 실제 순위입니다.

import type { PeerDay, PeerStat } from '@/lib/types';

export type Metric = 'study' | 'focus' | 'days' | { subj: string };

export interface Standing {
  /** 반 전체 값 (높을수록 좋음) */
  values: number[];
  mine: number;
  /** 1등 = 1 */
  rank: number;
  size: number;
  avg: number;
  top: number;
  /** 상위 몇 % (1등이면 5% 같은 식) */
  topPct: number;
  /** 바로 위 순위까지 필요한 차이 (1등이면 null) */
  toNext: number | null;
}

export type Tier = 'gold' | 'good' | 'mid' | 'low';

export const TIER_COLOR: Record<Tier, string> = {
  gold: '#fbbf24',
  good: '#22c55e',
  mid: '#3b82f6',
  low: '#ef4444',
};

export function tierOf(topPct: number): Tier {
  if (topPct <= 10) return 'gold';
  if (topPct <= 40) return 'good';
  if (topPct <= 70) return 'mid';
  return 'low';
}

function sumDays(peer: PeerStat, dates: string[], pick: (d: PeerDay) => number): number {
  return dates.reduce((a, d) => a + (peer.days[d] ? pick(peer.days[d]) : 0), 0);
}

export function peerValue(peer: PeerStat, dates: string[], metric: Metric): number {
  if (metric === 'study') return sumDays(peer, dates, (d) => d.study);
  if (metric === 'days') return dates.filter((d) => (peer.days[d]?.study ?? 0) >= 1).length;
  if (metric === 'focus') {
    const study = sumDays(peer, dates, (d) => d.study);
    const pause = sumDays(peer, dates, (d) => d.pause);
    return study + pause > 0 ? (study / (study + pause)) * 100 : 0;
  }
  return sumDays(peer, dates, (d) => d.subj[metric.subj] ?? 0);
}

export function standing(peers: PeerStat[], dates: string[], metric: Metric): Standing | null {
  const me = peers.find((p) => p.is_me);
  if (!me || peers.length === 0) return null;
  const values = peers.map((p) => peerValue(p, dates, metric));
  const mine = peerValue(me, dates, metric);
  // 반올림 오차로 동점이 갈리지 않게 0.5 단위로 비교
  const above = values.filter((v) => v > mine + 0.5);
  const rank = above.length + 1;
  const size = values.length;
  return {
    values,
    mine,
    rank,
    size,
    avg: values.reduce((a, v) => a + v, 0) / size,
    top: Math.max(...values),
    topPct: Math.max(1, Math.round((rank / size) * 100)),
    toNext: above.length ? Math.min(...above) - mine : null,
  };
}
