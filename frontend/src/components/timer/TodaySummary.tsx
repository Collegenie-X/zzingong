'use client';

// 오늘 한눈에 보기: 순공 시간 / 목표 달성률 / 집중률 / 딴짓 / 완료 과목
// 학생이 선택되지 않았을 때는 안내 문구를 대신 보여줍니다.

import Link from 'next/link';
import { fmtKorean, pct } from '@/lib/format';
import type { SessionRecord, Subject } from '@/lib/types';

interface Props {
  studentId: string;
  sessions: SessionRecord[];
  subjects: Subject[];
}

export default function TodaySummary({ studentId, sessions, subjects }: Props) {
  if (!studentId) {
    return (
      <div className="today-summary-bar guide">
        <span className="guide-icon" aria-hidden>
          👋
        </span>
        <div className="guide-text">
          <strong>먼저 위에서 학생을 선택해 주세요.</strong>
          <span>등록된 학생이 없다면 &lsquo;+ 추가&rsquo;를 눌러 이름만 넣으면 바로 시작할 수 있어요.</span>
        </div>
        <Link href="/about" className="guide-link">
          찐공AI가 처음이라면 →
        </Link>
      </div>
    );
  }

  const study = sessions.reduce((a, s) => a + s.duration_seconds, 0);
  const distraction = sessions.reduce((a, s) => a + s.distraction_seconds, 0);
  const goalSec = subjects.filter((s) => s.done !== 2).reduce((a, s) => a + s.goal_minutes * 60, 0);
  const doneCount = subjects.filter((s) => s.done === 1).length;
  const rate = pct(study, goalSec);
  const focus = study + distraction > 0 ? pct(study, study + distraction) : 100;

  return (
    <div className="today-summary-bar">
      <div className="tsb-main">
        <div className="tsb-head">
          <span className="lbl">오늘 순공 시간</span>
          <span className="goal">목표 {fmtKorean(goalSec)}</span>
        </div>
        <div className="tsb-value">
          {fmtKorean(study)}
          <em>{rate}%</em>
        </div>
        <div className="tsb-track">
          <div className="fill" style={{ width: `${Math.min(rate, 100)}%` }} />
        </div>
      </div>
      <div className="tsb-stats">
        <div className="tsb-stat">
          <div className="v">{focus}%</div>
          <div className="k">집중률</div>
        </div>
        <div className="tsb-stat">
          <div className="v warn">{fmtKorean(distraction)}</div>
          <div className="k">딴짓</div>
        </div>
        <div className="tsb-stat">
          <div className="v">
            {doneCount}
            <span className="of">/{subjects.length}</span>
          </div>
          <div className="k">완료 과목</div>
        </div>
        <div className="tsb-stat">
          <div className="v">{sessions.length}</div>
          <div className="k">세션</div>
        </div>
      </div>
    </div>
  );
}
