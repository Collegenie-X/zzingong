'use client';

// 데이터 뷰어 페이지 (원본 db_viewer.html 대체)
// localStorage에 저장된 학생/과목/세션 데이터를 조회하고,
// 더미 데이터 재생성 / 초기화 / JSON 내보내기·가져오기를 지원합니다.

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { SessionRecord, Student, Subject } from '@/lib/types';
import '@/styles/data.css';

type TableName = 'sessions' | 'students' | 'subjects';

interface SubjectStat {
  subject: string;
  session_count: number;
  avg_minutes: number;
  total_minutes: number;
  min_minutes: number;
  max_minutes: number;
  avg_pause_count: number;
  student_count: number;
}

const LIMIT = 100;

export default function DataPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [table, setTable] = useState<TableName>('sessions');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setStudents(await api.getStudents());
    setSubjects(await api.getSubjects());
    setSessions(await api.getAllSessions());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── 과목별 통계 (원본 /api/db/stats/subjects 포팅) ──
  const subjectStats: SubjectStat[] = (() => {
    const map = new Map<string, { durs: number[]; pauses: number[]; students: Set<string> }>();
    for (const s of sessions) {
      let b = map.get(s.subject);
      if (!b) map.set(s.subject, (b = { durs: [], pauses: [], students: new Set() }));
      b.durs.push(s.duration_seconds);
      b.pauses.push(s.pause_count);
      b.students.add(s.student_id);
    }
    const round1 = (v: number) => Math.round(v * 10) / 10;
    return [...map.entries()]
      .map(([subject, b]) => ({
        subject,
        session_count: b.durs.length,
        avg_minutes: round1(b.durs.reduce((a, x) => a + x, 0) / b.durs.length / 60),
        total_minutes: round1(b.durs.reduce((a, x) => a + x, 0) / 60),
        min_minutes: round1(Math.min(...b.durs) / 60),
        max_minutes: round1(Math.max(...b.durs) / 60),
        avg_pause_count: round1(b.pauses.reduce((a, x) => a + x, 0) / b.pauses.length),
        student_count: b.students.size,
      }))
      .sort((a, b) => b.total_minutes - a.total_minutes);
  })();

  // ── 테이블 행 구성 ──
  const studentName = (id: string) => students.find((s) => s.id === id)?.name ?? id;
  const rowsOf = (): { columns: string[]; rows: (string | number)[][] } => {
    if (table === 'students')
      return {
        columns: ['id', 'name', 'created_at'],
        rows: students.map((s) => [s.id, s.name, s.created_at]),
      };
    if (table === 'subjects')
      return {
        columns: ['name', 'goal_minutes', 'color', 'done', 'sort_order'],
        rows: subjects.map((s) => [s.name, s.goal_minutes, s.color, s.done, s.sort_order]),
      };
    return {
      columns: ['id', '학생', 'subject', 'date', 'duration(분)', 'pause_count', 'pause(분)', 'start', 'end'],
      rows: [...sessions]
        .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
        .map((s) => [
          s.id,
          studentName(s.student_id),
          s.subject,
          s.date,
          Math.round(s.duration_seconds / 6) / 10,
          s.pause_count,
          Math.round(s.pause_seconds / 6) / 10,
          s.start_time.slice(11, 16),
          s.end_time.slice(11, 16),
        ]),
    };
  };

  const { columns, rows } = rowsOf();
  const filtered = search.trim()
    ? rows.filter((r) => r.some((v) => String(v).toLowerCase().includes(search.trim().toLowerCase())))
    : rows;
  const paged = filtered.slice(page * LIMIT, (page + 1) * LIMIT);
  const totalPages = Math.max(Math.ceil(filtered.length / LIMIT), 1);

  // ── 데이터 관리 ──
  const handleDummy = async () => {
    if (!confirm('기존 데이터가 삭제되고 더미 데이터(학생 20명 × 30일)가 새로 생성됩니다. 계속하시겠습니까?')) return;
    await api.regenerateDummy();
    await load();
  };

  const handleReset = async () => {
    if (!confirm('모든 데이터(학생/과목/세션)가 삭제됩니다. 계속하시겠습니까?')) return;
    await api.resetAll();
    await load();
  };

  const handleExport = async () => {
    const json = await api.exportAll();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study-timer-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const res = await api.importAll(await file.text());
    if (!res.ok) return alert(res.error);
    await load();
    alert('가져오기 완료');
  };

  const tabs: { name: TableName; label: string; count: number }[] = [
    { name: 'sessions', label: 'sessions', count: sessions.length },
    { name: 'students', label: 'students', count: students.length },
    { name: 'subjects', label: 'subjects', count: subjects.length },
  ];

  return (
    <div className="data-main">
      <div className="data-toolbar">
        <button className="data-btn primary" onClick={handleDummy}>더미 데이터 재생성</button>
        <button className="data-btn" onClick={handleExport}>JSON 내보내기</button>
        <button className="data-btn" onClick={() => fileRef.current?.click()}>JSON 가져오기</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImport(f);
            e.target.value = '';
          }}
        />
        <div className="spacer" />
        <button className="data-btn danger" onClick={handleReset}>전체 초기화</button>
      </div>

      <div className="data-card">
        <h3>과목별 통계</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>과목</th><th>세션 수</th><th>평균(분)</th><th>합계(분)</th>
              <th>최소(분)</th><th>최대(분)</th><th>평균 일시정지</th><th>학생 수</th>
            </tr>
          </thead>
          <tbody>
            {subjectStats.length === 0 ? (
              <tr><td colSpan={8} className="empty">데이터가 없습니다</td></tr>
            ) : (
              subjectStats.map((s) => (
                <tr key={s.subject}>
                  <td>{s.subject}</td>
                  <td>{s.session_count}</td>
                  <td>{s.avg_minutes}</td>
                  <td>{s.total_minutes}</td>
                  <td>{s.min_minutes}</td>
                  <td>{s.max_minutes}</td>
                  <td>{s.avg_pause_count}</td>
                  <td>{s.student_count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-tabs">
        {tabs.map((t) => (
          <button
            key={t.name}
            className={`table-tab${table === t.name ? ' active' : ''}`}
            onClick={() => {
              setTable(t.name);
              setPage(0);
            }}
          >
            {t.label}
            <span className="cnt">({t.count})</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          className="data-search"
          placeholder="검색..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </div>

      <div className="data-card">
        <table className="data-table">
          <thead>
            <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={columns.length} className="empty">데이터가 없습니다</td></tr>
            ) : (
              paged.map((r, i) => (
                <tr key={i}>
                  {r.map((v, j) => <td key={j}>{v}</td>)}
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="data-meta">
          총 {filtered.length}건 · {page + 1}/{totalPages} 페이지
          {totalPages > 1 && (
            <>
              {' · '}
              <button className="data-btn" onClick={() => setPage((p) => Math.max(p - 1, 0))} disabled={page === 0}>
                이전
              </button>{' '}
              <button
                className="data-btn"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={page >= totalPages - 1}
              >
                다음
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
