'use client';

// 오늘의 기록 카드: 표 대신 "바로 느껴지는" 그래프
// - 상단: 오늘 상황을 이모지 + 한 줄 메시지로
// - 과목별 막대: 목표 대비 순공(과목 색) + 딴짓(빨간 빗금), 흰 선이 목표
// - 하루 타임라인: 언제 공부했는지 세션 블록으로
// - 과목을 누르면 그 과목의 자세한 기록을 팝업으로 보여줍니다

import { useCallback, useState } from 'react';
import Twemoji from '@/components/Twemoji';
import SubjectDetailModal from './SubjectDetailModal';
import { fmtKorean, pct } from '@/lib/format';
import type { SessionRecord, Subject } from '@/lib/types';

interface Props {
  sessions: SessionRecord[];
  subjects: Subject[];
  hidden?: boolean;
}

interface Row {
  name: string;
  color: string;
  goalSec: number;
  study: number;
  distraction: number;
}

/** 오늘 전체 상황 — 목표 달성률이 기본, 집중률이 낮으면 경고를 덧붙입니다 */
function overallStatus(rate: number, focus: number) {
  if (rate >= 100)
    return {
      char: '🔥',
      label: '목표 달성',
      head: '목표 달성! 오늘 완전 찐공',
    };
  if (rate >= 60)
    return {
      char: '💪',
      label: '목표 근접',
      head: '거의 다 왔어요, 조금만 더!',
    };
  if (rate >= 25) return { char: '🌱', label: '진행 중', head: '시동 걸렸어요, 쭉 가봐요' };
  if (focus < 70)
    return {
      char: '😴',
      label: '딴짓 많음',
      head: '딴짓이 공부를 앞지르고 있어요',
    };
  return { char: '😴', label: '워밍업', head: '아직 워밍업 중이에요' };
}

/** 과목 하나의 상황 */
function rowStatus(r: Row) {
  const rate = pct(r.study, r.goalSec);
  if (r.goalSec > 0 && rate >= 100) return { char: '🎯', label: '목표 달성' };
  if (r.study > 0 && r.distraction > r.study * 0.4) return { char: '😴', label: '딴짓 많음' };
  if (rate >= 50 || (r.goalSec === 0 && r.study > 0)) return { char: '💪', label: '절반 넘음' };
  if (r.study > 0) return { char: '🌱', label: '시작함' };
  return { char: '😴', label: '아직 안 함' };
}

const timeOf = (d: Date) => d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });

export default function TodayLog({ sessions, subjects, hidden }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const colorOf = (name: string) => subjects.find((s) => s.name === name)?.color ?? '#888';

  // 과목별로 묶기: 오늘 계획한 과목(건너뛰기 제외) + 계획에 없지만 기록이 있는 과목
  const map = new Map<string, Row>();
  subjects
    .filter((s) => s.done !== 2)
    .forEach((s) =>
      map.set(s.name, {
        name: s.name,
        color: s.color,
        goalSec: s.goal_minutes * 60,
        study: 0,
        distraction: 0,
      }),
    );
  sessions.forEach((s) => {
    let r = map.get(s.subject);
    if (!r) {
      r = {
        name: s.subject,
        color: colorOf(s.subject),
        goalSec: 0,
        study: 0,
        distraction: 0,
      };
      map.set(s.subject, r);
    }
    r.study += s.duration_seconds;
    r.distraction += s.distraction_seconds;
  });
  const rows = [...map.values()].sort(
    (a, b) => pct(b.study, b.goalSec || b.study) - pct(a.study, a.goalSec || a.study),
  );

  const study = rows.reduce((a, r) => a + r.study, 0);
  const distraction = rows.reduce((a, r) => a + r.distraction, 0);
  const goal = rows.reduce((a, r) => a + r.goalSec, 0);
  const rate = pct(study, goal);
  const focus = study + distraction > 0 ? pct(study, study + distraction) : 100;
  const status = overallStatus(rate, focus);

  // 모든 막대를 같은 눈금으로 → 과목끼리 길이로 바로 비교됩니다
  const scale = Math.max(1, ...rows.map((r) => Math.max(r.goalSec, r.study + r.distraction))) * 1.05;
  const w = (sec: number) => `${(sec / scale) * 100}%`;

  // 타임라인 범위: 첫 시작 ~ 마지막 종료
  const spans = sessions
    .filter((s) => s.start_time && s.end_time)
    .map((s) => ({
      id: s.id,
      color: colorOf(s.subject),
      name: s.subject,
      a: +new Date(s.start_time),
      b: +new Date(s.end_time),
    }));
  const t0 = Math.min(...spans.map((s) => s.a));
  const t1 = Math.max(...spans.map((s) => s.b));
  const span = Math.max(t1 - t0, 1);
  const active = rows.find((r) => r.name === open) ?? null;

  return (
    <div className="card today-log" style={hidden ? { display: 'none' } : undefined}>
      <div className="card-header">
        <h2>오늘의 기록</h2>
        {sessions.length > 0 && <span className="info">{sessions.length}세션</span>}
      </div>

      {sessions.length === 0 ? (
        <div className="tl-empty">
          <Twemoji char="😴" label="기록 없음" size={34} />
          <span>아직 기록이 없어요. 첫 세션을 시작해 볼까요?</span>
        </div>
      ) : (
        <>
          <div className="tl-hero">
            <Twemoji char={status.char} label={status.label} size={40} className="tl-hero-emoji" />
            <div className="tl-hero-text">
              <strong>{status.head}</strong>
              <span>
                순공 <b>{fmtKorean(study)}</b>
                {goal > 0 && (
                  <>
                    {' '}
                    · 목표의 <b className={rate >= 100 ? 'good' : ''}>{rate}%</b>
                  </>
                )}
                {' · '}집중 <b className={focus < 70 ? 'bad' : 'good'}>{focus}%</b>
              </span>
            </div>
          </div>

          <ul className="tl-bars">
            {rows.map((r) => {
              const st = rowStatus(r);
              const r100 = pct(r.study, r.goalSec);
              return (
                <li key={r.name} className={r.study === 0 ? 'zero' : undefined}>
                  <button
                    type="button"
                    className="tl-row"
                    onClick={() => setOpen(r.name)}
                    aria-label={`${r.name} 자세히 보기`}
                  >
                    <Twemoji char={st.char} label={st.label} size={20} className="tl-row-emoji" />
                    <span className="tl-name">{r.name}</span>
                    <div className="tl-track">
                      <div className="tl-fill" style={{ width: w(r.study), background: r.color }} />
                      {r.distraction > 0 && <div className="tl-fill fake" style={{ width: w(r.distraction) }} />}
                      {r.goalSec > 0 && <div className="tl-goal" style={{ left: w(r.goalSec) }} />}
                    </div>
                    <span className="tl-val">
                      {fmtKorean(r.study)}
                      {r.goalSec > 0 && <em className={r100 >= 100 ? 'good' : ''}>{r100}%</em>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="tl-legend">
            <span className="k study">순공</span>
            {distraction > 0 && <span className="k fake">딴짓 {fmtKorean(distraction)}</span>}
            <span className="k goal">목표</span>
          </div>

          {spans.length > 0 && (
            <div className="tl-timeline">
              <div className="tl-tl-track">
                {spans.map((s) => (
                  <div
                    key={s.id}
                    className="tl-block"
                    title={`${s.name} ${timeOf(new Date(s.a))}~${timeOf(new Date(s.b))}`}
                    style={{
                      left: `${((s.a - t0) / span) * 100}%`,
                      width: `max(3px, ${((s.b - s.a) / span) * 100}%)`,
                      background: s.color,
                    }}
                  />
                ))}
              </div>
              <div className="tl-tl-axis">
                <span>{timeOf(new Date(t0))}</span>
                <span>{timeOf(new Date(t1))}</span>
              </div>
            </div>
          )}
        </>
      )}

      {active && (
        <SubjectDetailModal
          name={active.name}
          color={active.color}
          goalSec={active.goalSec}
          study={active.study}
          distraction={active.distraction}
          status={rowStatus(active)}
          sessions={sessions.filter((s) => s.subject === active.name)}
          onClose={close}
        />
      )}
    </div>
  );
}
