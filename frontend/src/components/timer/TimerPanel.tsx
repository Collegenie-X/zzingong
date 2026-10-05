'use client';

// 타이머 카드: 선택 과목 / 경과 시간 / 진행 바 / 시작·일시정지·종료 버튼 / AI 코멘트
// 측정이 시작되면 "플레이 모드"로 바뀝니다: 작은 타이머·버튼 + 찐공 vs 가짜 공부 레이스

import { fmtHMS } from '@/lib/format';
import { calcTimes } from '@/lib/plan';
import type { Subject } from '@/lib/types';
import type { FakeStatus } from './MonitorPanel';
import RaceTrack from './RaceTrack';

interface Props {
  subjects: Subject[];
  selected: string | null;
  elapsed: number;
  running: boolean;
  pauseCount: number;
  started: boolean;
  comment: string;
  fake: FakeStatus;
  onFocusBack: () => void;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
}

export default function TimerPanel({
  subjects,
  selected,
  elapsed,
  running,
  pauseCount,
  started,
  comment,
  fake,
  onFocusBack,
  onStart,
  onPause,
  onStop,
}: Props) {
  const subject = selected ? subjects.find((s) => s.name === selected) : undefined;

  let schedule = '';
  let sub = '';
  let progress = 0;
  let over = false;

  if (subject) {
    const idx = subjects.indexOf(subject);
    const t = calcTimes(subjects)[idx];
    const goalH = Math.floor(subject.goal_minutes / 60);
    const goalM = subject.goal_minutes % 60;
    const goalStr = goalH > 0 ? `${goalH}시간${goalM > 0 ? ` ${goalM}분` : ''}` : `${goalM}분`;
    schedule = `목표: ${goalStr} | 예상 종료: ~${t.overMidnight ? '자정초과' : t.end}`;

    const goalSec = subject.goal_minutes * 60;
    progress = Math.min((elapsed / goalSec) * 100, 100);
    over = elapsed >= goalSec;

    if (running) {
      sub = over ? `목표 달성! +${fmtHMS(elapsed - goalSec)} 초과 진행 중` : `남은: ${fmtHMS(goalSec - elapsed)}`;
    } else if (started) {
      sub = `일시정지 중 (${pauseCount}회)`;
    } else {
      sub = '시작 버튼을 눌러주세요';
    }
  }

  if (subject && started) {
    const goalSec = subject.goal_minutes * 60;
    const real = Math.max(elapsed - fake.total, 0);
    const left = goalSec - real;
    return (
      <div className={`card timer-section play${running ? ' running' : ''}`}>
        {/* 모바일에서는 play-head 가 화면 위에 고정되므로 그 자리를 비워 둡니다 */}
        <div className="play-head-spacer" aria-hidden />
        <div className={`play-head${!running ? ' paused' : fake.tag ? ' fake' : ''}`}>
          <div className="play-info">
            <span className="play-subject" style={{ color: subject.color }}>
              <i style={{ background: subject.color }} />
              {subject.name}
            </span>
            <span className="play-clock">{fmtHMS(elapsed)}</span>
            <span className="play-left">
              {!running
                ? `일시정지 ${pauseCount}회`
                : left > 0
                  ? `골까지 찐공 ${fmtHMS(left)}`
                  : `골인! +${fmtHMS(-left)}`}
            </span>
          </div>
          <div className="timer-buttons play-buttons">
            {running ? (
              <button className="btn btn-pause" onClick={onPause} aria-label="일시정지">
                ❚❚ 일시정지
              </button>
            ) : (
              <button className="btn btn-start" onClick={onStart} aria-label="계속하기">
                ▶ 계속
              </button>
            )}
            <button className="btn btn-stop" onClick={onStop} aria-label="종료하고 저장">
              ■ 종료 &amp; 저장
            </button>
          </div>
        </div>
        <RaceTrack
          color={subject.color}
          elapsed={elapsed}
          goalSec={goalSec}
          running={running}
          fake={fake}
          onFocusBack={onFocusBack}
        />
      </div>
    );
  }

  return (
    <div className={`card timer-section${running ? ' running' : ''}`}>
      <div className="selected-subject" style={{ color: subject?.color ?? '#555' }}>
        {subject ? subject.name : '과목을 선택하세요'}
      </div>
      <div className="timer-schedule">{schedule}</div>
      <div className="timer-display" style={running ? { color: subject?.color ?? '#e0e0e0' } : undefined}>
        {fmtHMS(elapsed)}
      </div>
      <div className="timer-progress">
        <div className={`bar${over ? ' over' : ''}`} style={{ width: `${over ? 100 : progress}%` }} />
      </div>
      <div className="timer-sub">{sub}</div>
      <div className="timer-buttons">
        <button className="btn btn-start" onClick={onStart} disabled={!subject || running}>
          시작
        </button>
        <button className="btn btn-pause" onClick={onPause} disabled={!running}>
          일시정지
        </button>
        <button className="btn btn-stop" onClick={onStop} disabled={!started}>
          종료 &amp; 저장
        </button>
      </div>
      {comment && (
        <div className="comment-box">
          <div className="label">AI 코멘트</div>
          <div className="text">{comment}</div>
        </div>
      )}
    </div>
  );
}
