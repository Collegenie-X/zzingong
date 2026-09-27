'use client';

// 계획 총 순공 시간 — 목표 대비 막대 그래프 한 줄로 보여줍니다.
// 목표 이내는 파란색, 목표를 넘긴 만큼은 빨간색. 종료가 자정을 넘기면 빨간색 + 🌙.

import Twemoji from '@/components/Twemoji';
import { fmtMinKorean } from '@/lib/format';
import { dayConfig } from '@/lib/plan';

interface Props {
  totalMinutes: number;
  endTime: string;
  /** 계획 종료가 자정을 넘기는지 */
  overMidnight: boolean;
}

/** 목표 대비 상황을 이모지 하나로 */
function statusEmoji(diff: number): { char: string; label: string } {
  if (diff > 60) return { char: '🔥', label: '목표보다 많이 초과' };
  if (diff > 0) return { char: '💪', label: '목표보다 조금 초과' };
  if (diff === 0) return { char: '🎯', label: '목표와 일치' };
  if (diff >= -60) return { char: '🌱', label: '목표에 조금 부족' };
  return { char: '😴', label: '목표에 많이 부족' };
}

export default function PlanSummary({ totalMinutes, endTime, overMidnight }: Props) {
  const cfg = dayConfig();
  const target = cfg.target_minutes;
  const diff = totalMinutes - target;
  const status = statusEmoji(diff);

  // 목표선이 항상 막대 안에 보이도록 총 시간과 목표 중 큰 값 기준으로 눈금을 잡습니다.
  const scale = Math.max(totalMinutes, target) * 1.15 || 1;
  const w = (min: number) => `${Math.max(0, (min / scale) * 100)}%`;

  const within = Math.min(totalMinutes, target);
  const over = Math.max(0, diff);
  const short = Math.max(0, -diff);

  return (
    <div className="plan-summary">
      <div className="ps-top">
        <Twemoji char={status.char} label={status.label} size={26} className="ps-emoji" />
        <strong className={`ps-value${over > 0 ? ' over' : ''}`}>{fmtMinKorean(totalMinutes)}</strong>
        <span className={`ps-end${overMidnight ? ' past-midnight' : ''}`}>
          {overMidnight && <Twemoji char="🌙" label="자정을 넘김" size={14} className="ps-moon" />}
          ~{endTime}
        </span>
      </div>

      <div className="ps-track">
        <div className="ps-fill within" style={{ width: w(within) }} />
        {over > 0 && <div className="ps-fill over" style={{ width: w(over) }} />}
        {short > 0 && <div className="ps-fill short" style={{ width: w(short) }} />}
        <div className="ps-target-line" style={{ left: w(target) }} />
      </div>

      <div className="ps-legend">
        <span className="ps-target-key">{fmtMinKorean(target)}</span>
        <span className={`ps-diff${diff > 0 ? ' over' : diff < 0 ? ' short' : ''}`}>
          {diff > 0 ? `+${fmtMinKorean(diff)}` : diff < 0 ? fmtMinKorean(diff) : '딱 맞음'}
        </span>
      </div>
    </div>
  );
}
