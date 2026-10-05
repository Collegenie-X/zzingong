'use client';

// 오늘의 기록에서 과목을 누르면 뜨는 팝업
// - 순공 / 목표 + 진행 막대
// - 집중/딴짓, 공부한 시간대는 접어 두고 눌러서 펼쳐 봅니다

import { useEffect } from 'react';
import Twemoji from '@/components/Twemoji';
import { fmtKorean, pct } from '@/lib/format';
import type { SessionRecord } from '@/lib/types';

const DISTRACTIONS = [
  { key: 'distraction_phone', icon: '📱', label: '핸드폰' },
  { key: 'distraction_spacing', icon: '😶', label: '멍때림' },
  { key: 'distraction_away', icon: '🚶', label: '자리 비움' },
  { key: 'distraction_drowsy', icon: '😴', label: '졸음' },
] as const;

const timeOf = (d: Date) => d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });

export interface SubjectDetailModalProps {
  name: string;
  color: string;
  goalSec: number;
  study: number;
  distraction: number;
  status: { char: string; label: string };
  /** 이 과목의 오늘 세션 */
  sessions: SessionRecord[];
  onClose: () => void;
}

export default function SubjectDetailModal({
  name,
  color,
  goalSec,
  study,
  distraction,
  status,
  sessions,
  onClose,
}: SubjectDetailModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const rate = pct(study, goalSec);
  const focus = study + distraction > 0 ? pct(study, study + distraction) : 100;
  // 1분 미만은 "0분"으로 보여 헷갈리니 뺍니다
  const kinds = DISTRACTIONS.map((d) => ({ ...d, sec: sessions.reduce((a, s) => a + s[d.key], 0) }))
    .filter((d) => d.sec >= 60)
    .sort((a, b) => b.sec - a.sec);
  const sorted = [...sessions].sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal sdm"
        role="dialog"
        aria-modal="true"
        aria-label={`${name} 자세히 보기`}
        style={{ '--c': color } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sdm-head">
          <Twemoji char={status.char} label={status.label} size={30} />
          <div className="sdm-title">
            <strong>{name}</strong>
            <span>{status.label}</span>
          </div>
          <button type="button" className="sdm-close" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <section className="sdm-sec">
          <div className="sdm-big">
            <b>{fmtKorean(study)}</b>
            {goalSec > 0 && (
              <>
                <span>/ {fmtKorean(goalSec)}</span>
                <em className={rate >= 100 ? 'good' : ''}>{rate}%</em>
              </>
            )}
          </div>
          {goalSec > 0 && (
            <div className="sdm-progress">
              <div style={{ width: `${Math.min(100, rate)}%`, background: color }} />
            </div>
          )}
        </section>

        <details className="sdm-fold">
          <summary>
            <span>
              집중 <b className={focus < 70 ? 'bad' : 'good'}>{focus}%</b>
            </span>
            {distraction >= 60 && <em className="ng">딴짓 {fmtKorean(distraction)}</em>}
          </summary>
          <div className="sdm-focus">
            <span className="ok" style={{ width: `${focus}%`, background: color }} />
            <span className="ng" style={{ width: `${100 - focus}%` }} />
          </div>
          {kinds.length > 0 && (
            <p className="sdm-kinds">
              {kinds.map((k) => (
                <span key={k.key}>
                  {k.icon} {k.label} {fmtKorean(k.sec)}
                </span>
              ))}
            </p>
          )}
        </details>

        <details className="sdm-fold">
          <summary>
            <span>공부한 시간</span>
            <em>{sessions.length}회</em>
          </summary>
          {sorted.length === 0 ? (
            <p className="sdm-empty">아직 이 과목 기록이 없어요</p>
          ) : (
            <ul className="sdm-sessions">
              {sorted.map((s) => (
                <li key={s.id}>
                  <span className="t">
                    {s.start_time ? timeOf(new Date(s.start_time)) : '-'} –{' '}
                    {s.end_time ? timeOf(new Date(s.end_time)) : '-'}
                  </span>
                  <span className="d">{fmtKorean(s.duration_seconds)}</span>
                </li>
              ))}
            </ul>
          )}
        </details>
      </div>
    </div>
  );
}
