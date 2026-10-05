'use client';

// 과목 추가 / 수정 모달 — 이름·목표 시간·색상을 입력받습니다.

import { useEffect, useRef, useState } from 'react';
import type { Distractions, Subject, SubjectInput } from '@/lib/types';

const PALETTE = [
  '#3b82f6', '#06b6d4', '#14b8a6', '#22c55e',
  '#84cc16', '#eab308', '#f97316', '#ef4444',
  '#ec4899', '#f43f5e', '#a855f7', '#8b5cf6',
];

const QUICK_MINUTES = [20, 30, 40, 45, 60, 90];

const TEST_KINDS: { key: keyof Distractions; label: string }[] = [
  { key: 'phone', label: '📱 핸드폰' },
  { key: 'spacing', label: '😶 멍때림' },
  { key: 'away', label: '🚶 자리 비움' },
  { key: 'drowsy', label: '😴 졸음' },
];

export interface SubjectFormModalProps {
  /** null 이면 새 과목 추가, 값이 있으면 그 과목 수정 */
  subject: Subject | null;
  error: string;
  onSubmit: (input: SubjectInput) => void;
  onCancel: () => void;
  /** 개발 환경 전용: 이 과목으로 임의의 오늘 기록을 추가합니다. 오류 문구 또는 null 반환 */
  onTestSession?: (subject: string, studyMin: number, distMin: number, kind: keyof Distractions) => Promise<string | null>;
}

export default function SubjectFormModal({ subject, error, onSubmit, onCancel, onTestSession }: SubjectFormModalProps) {
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

        {subject && onTestSession && <TestSessionBox subject={subject.name} onAdd={onTestSession} />}

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

/** 개발용 테스트 기록 추가 — 순공/딴짓 분을 넣으면 지금 끝난 세션으로 저장됩니다 */
function TestSessionBox({
  subject,
  onAdd,
}: {
  subject: string;
  onAdd: NonNullable<SubjectFormModalProps['onTestSession']>;
}) {
  const [study, setStudy] = useState('20');
  const [dist, setDist] = useState('0');
  const [kind, setKind] = useState<keyof Distractions>('phone');
  const [msg, setMsg] = useState('');

  const add = async () => {
    const s = Number(study);
    const d = Number(dist);
    if (!(s >= 0 && d >= 0) || s + d <= 0) return setMsg('0보다 큰 값을 넣어 주세요');
    const err = await onAdd(subject, s, d, kind);
    setMsg(err ?? `✓ 순공 ${s}분${d > 0 ? ` · 딴짓 ${d}분` : ''} 추가됨`);
  };

  return (
    <fieldset className="modal-test">
      <legend>🧪 테스트 기록 추가 (개발용)</legend>
      <div className="row">
        <label>
          순공(분)
          <input className="modal-input" type="number" min={0} max={600} value={study} onChange={(e) => setStudy(e.target.value)} />
        </label>
        <label>
          딴짓(분)
          <input className="modal-input" type="number" min={0} max={600} value={dist} onChange={(e) => setDist(e.target.value)} />
        </label>
        <label>
          딴짓 종류
          <select className="modal-input" value={kind} onChange={(e) => setKind(e.target.value as keyof Distractions)}>
            {TEST_KINDS.map((k) => (
              <option key={k.key} value={k.key}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="modal-chips">
        {[10, 30, 60].map((m) => (
          <button key={m} type="button" className="modal-chip" onClick={() => setStudy(String(Number(study || 0) + m))}>
            +{m}분
          </button>
        ))}
        <button type="button" className="modal-btn primary small" onClick={add}>
          기록 추가
        </button>
      </div>
      {msg && <p className="modal-test-msg">{msg}</p>}
    </fieldset>
  );
}
