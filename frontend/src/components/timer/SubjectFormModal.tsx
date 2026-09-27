'use client';

// 과목 추가 / 수정 모달 — 이름·목표 시간·색상을 입력받습니다.

import { useEffect, useRef, useState } from 'react';
import type { Subject, SubjectInput } from '@/lib/types';

const PALETTE = [
  '#3b82f6', '#06b6d4', '#14b8a6', '#22c55e',
  '#84cc16', '#eab308', '#f97316', '#ef4444',
  '#ec4899', '#f43f5e', '#a855f7', '#8b5cf6',
];

const QUICK_MINUTES = [20, 30, 40, 45, 60, 90];

interface Props {
  /** null 이면 새 과목 추가, 값이 있으면 그 과목 수정 */
  subject: Subject | null;
  error: string;
  onSubmit: (input: SubjectInput) => void;
  onCancel: () => void;
}

export default function SubjectFormModal({ subject, error, onSubmit, onCancel }: Props) {
  const [name, setName] = useState(subject?.name ?? '');
  const [minutes, setMinutes] = useState(String(subject?.goal_minutes ?? 30));
  const [color, setColor] = useState(subject?.color ?? PALETTE[0]);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
    nameRef.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, goal_minutes: Number(minutes), color });
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={subject ? '과목 수정' : '과목 추가'}
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h3 className="modal-title">{subject ? '과목 수정' : '과목 추가'}</h3>

        <label className="modal-label" htmlFor="subj-name">과목 이름</label>
        <input
          id="subj-name"
          ref={nameRef}
          className="modal-input"
          value={name}
          maxLength={12}
          placeholder="예) 수학"
          onChange={(e) => setName(e.target.value)}
        />

        <label className="modal-label" htmlFor="subj-min">목표 시간 (분)</label>
        <input
          id="subj-min"
          className="modal-input"
          type="number"
          min={5}
          max={600}
          step={5}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <div className="modal-chips">
          {QUICK_MINUTES.map((m) => (
            <button
              key={m}
              type="button"
              className={`modal-chip${Number(minutes) === m ? ' active' : ''}`}
              onClick={() => setMinutes(String(m))}
            >
              {m}분
            </button>
          ))}
        </div>

        <label className="modal-label">색상</label>
        <div className="modal-swatches">
          {PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              className={`modal-swatch${color.toLowerCase() === c ? ' active' : ''}`}
              style={{ background: c }}
              aria-label={`색상 ${c}`}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="modal-btn ghost" onClick={onCancel}>
            취소
          </button>
          <button type="submit" className="modal-btn primary">
            {subject ? '저장' : '추가'}
          </button>
        </div>
      </form>
    </div>
  );
}
