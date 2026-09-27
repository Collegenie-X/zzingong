'use client';

// 오늘의 공부 계획 카드: 과목 CRUD + 드래그 순서 변경 + 완료 토글 + 선택
// 예상 시각은 자정 이내면 파란색, 자정을 넘기면 빨간색으로 표시합니다.

import { useState } from 'react';
import { calcTimes, dayConfig, planTotalMinutes } from '@/lib/plan';
import type { Subject, SubjectInput } from '@/lib/types';
import PlanSummary from './PlanSummary';
import SubjectFormModal from './SubjectFormModal';

interface Props {
  subjects: Subject[];
  selected: string | null;
  running: boolean;
  onSelect: (name: string) => void;
  onDeselect: () => void;
  onToggleDone: (name: string) => void;
  onReorder: (subjects: Subject[]) => void;
  onAdd: (input: SubjectInput) => Promise<string | null>;
  onEdit: (name: string, input: SubjectInput) => Promise<string | null>;
  onDelete: (name: string) => Promise<string | null>;
}

/** 모달 상태: 닫힘 | 추가 | 특정 과목 수정 */
type FormState = { mode: 'add' } | { mode: 'edit'; subject: Subject } | null;

export default function PlanList({
  subjects,
  selected,
  running,
  onSelect,
  onDeselect,
  onToggleDone,
  onReorder,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const [dragSrc, setDragSrc] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(null);
  const [formError, setFormError] = useState('');

  const times = calcTimes(subjects);
  const activeTotal = planTotalMinutes(subjects);
  const lastActive = [...times].reverse().find((t) => !t.skipped) ?? times[times.length - 1];
  const cfg = dayConfig();

  const handleDrop = (to: number) => {
    setDragOver(null);
    if (dragSrc === null || dragSrc === to) return;
    const next = [...subjects];
    const [item] = next.splice(dragSrc, 1);
    next.splice(to, 0, item);
    onReorder(next);
  };

  const openAdd = () => {
    setFormError('');
    setForm({ mode: 'add' });
  };

  const openEdit = (subject: Subject) => {
    setFormError('');
    setForm({ mode: 'edit', subject });
  };

  const handleSubmit = async (input: SubjectInput) => {
    if (!form) return;
    const error =
      form.mode === 'add' ? await onAdd(input) : await onEdit(form.subject.name, input);
    if (error) {
      setFormError(error);
      return;
    }
    setForm(null);
  };

  const handleDelete = async (subject: Subject) => {
    if (!confirm(`'${subject.name}' 과목을 계획에서 삭제할까요?\n지금까지의 공부 기록은 그대로 남습니다.`))
      return;
    const error = await onDelete(subject.name);
    if (error) alert(error);
  };

  return (
    <div className="card" data-plan-card>
      <div className="card-header">
        <h2>오늘의 공부 계획</h2>
        <div className="plan-header-actions">
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
          <button
            className="plan-add-btn"
            title="과목 추가"
            onClick={(e) => {
              e.stopPropagation();
              openAdd();
            }}
          >
            + 과목
          </button>
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
                <span className={`end${t.overMidnight ? ' past-midnight' : ''}`}>
                  {t.skipped ? '' : t.end}
                </span>
              </span>
              <span className="plan-actions">
                <button
                  className="plan-act-btn"
                  title="수정"
                  aria-label={`${s.name} 수정`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEdit(s);
                  }}
                >
                  ✎
                </button>
                <button
                  className="plan-act-btn del"
                  title="삭제"
                  aria-label={`${s.name} 삭제`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s);
                  }}
                >
                  ✕
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      {subjects.length === 0 && (
        <div className="plan-empty">
          아직 과목이 없어요. <button className="plan-empty-add" onClick={openAdd}>+ 과목 추가</button>
        </div>
      )}

      {subjects.length > 0 && (
        <PlanSummary
          totalMinutes={activeTotal}
          endTime={lastActive?.end ?? cfg.start_time}
          overMidnight={Boolean(lastActive?.overMidnight)}
        />
      )}

      <div className="plan-hint">
        과목을 클릭하면 타이머가 시작됩니다. 학원 시간을 뺀 순공 시간만 계산해요.
      </div>

      {form && (
        <SubjectFormModal
          subject={form.mode === 'edit' ? form.subject : null}
          error={formError}
          onSubmit={handleSubmit}
          onCancel={() => setForm(null)}
        />
      )}
    </div>
  );
}
