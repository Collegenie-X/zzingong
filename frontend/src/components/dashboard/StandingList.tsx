'use client';

// "항목별 내 순위" — 한 줄에 [항목] [반 전체 분포 + 내 위치] [순위] 로 표시

import { Gem } from '@/components/game/GameIcons';
import { fmtMinKorean } from '@/lib/format';
import { PeerStrip } from './DashIcons';
import { TIER_COLOR, tierOf, type Standing } from './rank';

export interface StandingRow {
  key: string;
  label: string;
  /** 과목 색 (과목 행이면 보석 아이콘 표시) */
  color?: string;
  unit: 'min' | 'pct' | 'day';
  st: Standing;
}

function fmtDiff(v: number, unit: StandingRow['unit']): string {
  const sign = v >= 0 ? '+' : '';
  if (unit === 'pct') return `${sign}${Math.round(v)}%p`;
  if (unit === 'day') return `${sign}${Math.round(v * 10) / 10}일`;
  return `${sign}${fmtMinKorean(v)}`;
}

export default function StandingList({ title, rows }: { title: string; rows: StandingRow[] }) {
  return (
    <div className="dash-card">
      <div className="card-head">
        <span>{title}</span>
        <span className="card-legend">
          <i className="lg-dot" />친구
          <i className="lg-avg" />평균
        </span>
      </div>
      {rows.map(({ key, label, color, unit, st }) => {
        const tc = TIER_COLOR[tierOf(st.topPct)];
        const diff = st.mine - st.avg;
        return (
          <div className="st-row" key={key} title={`${label}: 반 ${st.size}명 중 ${st.rank}등 (평균 대비 ${fmtDiff(diff, unit)})`}>
            <div className="st-label">
              {color && <Gem color={color} on={st.mine >= 1} size={14} />}
              <span style={color ? { color } : undefined}>{label}</span>
            </div>
            <PeerStrip values={st.values} mine={st.mine} avg={st.avg} color={tc} />
            <div className="st-rank">
              <b style={{ color: tc }}>{st.rank}</b>
              <small>/{st.size}</small>
              <em className={diff >= 0 ? 'up' : 'dn'}>{fmtDiff(diff, unit)}</em>
            </div>
          </div>
        );
      })}
    </div>
  );
}
