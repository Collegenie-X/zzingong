'use client';

// 오늘의 기록 카드: 세션 테이블 + 요약 통계

import { fmtHMS } from '@/lib/format';
import type { SessionRecord, Subject } from '@/lib/types';

interface Props {
  sessions: SessionRecord[];
  subjects: Subject[];
  hidden?: boolean;
}

export default function TodayLog({ sessions, subjects, hidden }: Props) {
  const getColor = (name: string) => subjects.find((s) => s.name === name)?.color ?? '#888';
  const total = sessions.reduce((a, s) => a + s.duration_seconds, 0);
  const totalPause = sessions.reduce((a, s) => a + s.pause_count, 0);

  const timeOf = (iso: string) =>
    iso ? new Date(iso).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div className="card today-log" style={hidden ? { display: 'none' } : undefined}>
      <div className="card-header">
        <h2>오늘의 기록</h2>
      </div>
      {sessions.length > 0 && (
        <div className="today-summary">
          <div className="stat">
            <div className="val">{sessions.length}</div>
            <div className="lbl">세션</div>
          </div>
          <div className="stat">
            <div className="val">
              {Math.floor(total / 3600)}h {Math.floor((total % 3600) / 60)}m
            </div>
            <div className="lbl">총 공부</div>
          </div>
          <div className="stat">
            <div className="val">{totalPause}</div>
            <div className="lbl">일시정지</div>
          </div>
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>과목</th>
            <th>공부 시간</th>
            <th>시작</th>
            <th>종료</th>
            <th>일시정지</th>
          </tr>
        </thead>
        <tbody>
          {sessions.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty">아직 기록이 없어요</td>
            </tr>
          ) : (
            sessions.map((s) => (
              <tr key={s.id}>
                <td>
                  <span className="subj-dot" style={{ background: getColor(s.subject) }} />
                  {s.subject}
                </td>
                <td>{fmtHMS(s.duration_seconds)}</td>
                <td>{timeOf(s.start_time)}</td>
                <td>{timeOf(s.end_time)}</td>
                <td>{s.pause_count}회</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
