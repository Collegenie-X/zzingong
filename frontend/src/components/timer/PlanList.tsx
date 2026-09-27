'use client';

// 오늘의 공부 계획 카드: 과목 목록 + 드래그 순서 변경 + 완료 토글 + 선택

import { useState } from 'react';
import { calcTimes } from '@/lib/plan';
import type { Subject } from '@/lib/types';

interface Props {
  subjects: Subject[];
  selected: string | null;
  running: boolean;
  onSelect: (name: string) => void;
  onDeselect: () => void;
  onToggleDone: (name: string) => void;
  onReorder: (subjects: Subject[]) => void;
}

export default function PlanList({
  subjects,
  selected,
  running,
  onSelect,
  onDeselect,
  onToggleDone,
  onReorder,
}: Props) {
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const times = calcTimes(subjects);
  const activeTotal = subjects.reduce((a, s) => a + (s.done === 2 ? 0 : s.goal_minutes), 0);
  const lastActive = [...times].reverse().find((t) => !t.skipped) ?? times[times.length - 1];

  const handleDrop = (to: number) => {
    setDragOver(null);
    if (dragSrc === null || dragSrc === to) return;
    const next = [...subjects];
    const [item] = next.splice(dragSrc, 1);
    next.splice(to, 0, item);
    onReorder(next);
  };

  return (
    <div className="card" data-plan-card>
      <div className="card-header">
        <h2>오늘의 공부 계획</h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {selected && (
            <button
              className="desel-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeselect();
              }}
            >
              선택 해제
            </button>
          )}
          <span className="info">{subjects.length > 0 ? `${subjects.length}과목` : ''}</span>
        </div>
      </div>

      <ul className="plan-list">
        {subjects.map((s, i) => {
          const t = times[i];
          const isDone = s.done === 1 || s.done === 2;
          const cls = [
            'plan-item',
            selected === s.name ? 'selected' : '',
            s.done === 1 ? 'done' : s.done === 2 ? 'skipped' : '',
            dragSrc === i ? 'dragging' : '',
            dragOver === i ? 'drag-over' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <li
              key={s.name}
              className={cls}
              draggable
              onDragStart={() => setDragSrc(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(i);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(i);
              }}
              onDragEnd={() => {
                setDragSrc(null);
                setDragOver(null);
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!running) onSelect(s.name);
              }}
            >
              <button
                className="plan-done-btn"
                title={isDone ? '취소' : '완료/건너뛰기'}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDone(s.name);
                }}
              >
                {isDone ? '✓' : ''}
              </button>
              <span className="drag-handle" title="순서 변경">&#9776;</span>
              <span className="plan-num">{i + 1}</span>
              <span className="plan-dot" style={{ background: s.color }} />
              <span className="plan-name">{s.name}</span>
              {s.done === 1 && <span className="plan-done-label completed">완료</span>}
              {s.done === 2 && <span className="plan-done-label skipped">건너뛰기</span>}
              <span className="plan-minutes">{s.goal_minutes}분</span>
              <span className="plan-time-range">
                {t.skipped ? '' : `${t.start}~`}
                <span className="end">{t.skipped ? '' : t.overMidnight ? '초과' : t.end}</span>
              </span>
            </li>
          );
        })}
      </ul>

      <div className="plan-total">
        {subjects.length > 0 && (
          <>
            총 <strong>
              {Math.floor(activeTotal / 60)}시간{activeTotal % 60 > 0 ? ` ${activeTotal % 60}분` : ''}
            </strong>{' '}
            · 종료 <strong>{lastActive?.overMidnight ? '자정 초과' : lastActive?.end}</strong>
          </>
        )}
      </div>

      <div className="plan-hint">과목을 클릭하면 타이머가 시작됩니다. 같은 과목을 여러 번 할 수 있어요.</div>
    </div>
  );
}
