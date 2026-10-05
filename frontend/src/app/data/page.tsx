'use client';

// 데이터 뷰어 페이지 (원본 db_viewer.html 대체)
// localStorage에 저장된 학생/과목/세션 데이터를 조회하고,
// 더미 데이터 재생성 / 초기화 / JSON 내보내기·가져오기를 지원합니다.

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { api } from '@/lib/api';
import { isoHM, isoLocal, todayStr } from '@/lib/format';
import type { SessionRecord, Student, Subject } from '@/lib/types';
import DetailModal, { type DetailTarget } from '@/components/data/DetailModal';
import '@/styles/data.css';

type TableName = 'sessions' | 'students' | 'subjects';
type SortDir = 'asc' | 'desc';

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

/** 표 한 열의 정의: 정렬 값 / 검색 텍스트 / 셀 렌더를 분리합니다 */
interface Column<T> {
  key: string;
  label: string;
  num?: boolean;
  sort: (row: T) => string | number;
  text?: (row: T) => string;
  render?: (row: T) => ReactNode;
}

const LIMIT = 50;
const FALLBACK_COLORS = ['#e94560', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#06b6d4', '#f97316', '#ec4899'];
const DONE_LABEL = ['미완료', '완료', '건너뛰기'] as const;

const round1 = (v: number) => Math.round(v * 10) / 10;
const fmtNum = (v: number) => v.toLocaleString('ko-KR');

/** 분 → "1시간 23분" / "23.4분" */
function fmtMinutes(min: number) {
  if (min < 60) return `${round1(min)}분`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${fmtNum(h)}시간 ${m}분` : `${fmtNum(h)}시간`;
}

export default function DataPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [table, setTable] = useState<TableName>('sessions');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [sort, setSort] = useState<{ key: string; dir: SortDir } | null>(null);
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setStudents(await api.getStudents());
    setSubjects(await api.getSubjects());
    setSessions(await api.getAllSessions());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── 이름/색 조회용 맵 ──
  const studentNames = useMemo(() => new Map(students.map((s) => [s.id, s.name])), [students]);
  const studentName = (id: string) => studentNames.get(id) ?? id;
  const sessionCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of sessions) m.set(s.student_id, (m.get(s.student_id) ?? 0) + 1);
    return m;
  }, [sessions]);

  const subjectColors = useMemo(() => {
    const m = new Map(subjects.map((s) => [s.name, s.color]));
    let i = 0;
    for (const s of sessions) {
      if (!m.has(s.subject)) m.set(s.subject, FALLBACK_COLORS[i++ % FALLBACK_COLORS.length]);
    }
    return m;
  }, [subjects, sessions]);
  const colorOf = (name: string) => subjectColors.get(name) ?? '#64748b';

  // ── 과목별 통계 (원본 /api/db/stats/subjects 포팅) ──
  const subjectStats: SubjectStat[] = useMemo(() => {
    const map = new Map<string, { durs: number[]; pauses: number[]; students: Set<string> }>();
    for (const s of sessions) {
      let b = map.get(s.subject);
      if (!b) map.set(s.subject, (b = { durs: [], pauses: [], students: new Set() }));
      b.durs.push(s.duration_seconds);
      b.pauses.push(s.pause_count);
      b.students.add(s.student_id);
    }
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
  }, [sessions]);

  const grandTotal = subjectStats.reduce((a, s) => a + s.total_minutes, 0);
  const maxTotal = subjectStats[0]?.total_minutes ?? 0;
  const dates = useMemo(() => [...new Set(sessions.map((s) => s.date))].sort(), [sessions]);

  // ── 표 열 정의 ──
  const sessionCols: Column<SessionRecord>[] = [
    { key: 'id', label: 'ID', num: true, sort: (s) => s.id, render: (s) => <span className="mono dim">#{s.id}</span> },
    {
      key: 'student', label: '학생', sort: (s) => studentName(s.student_id),
      render: (s) => (
        <span className="who">
          <i className="avatar">{studentName(s.student_id).slice(0, 1)}</i>
          {studentName(s.student_id)}
        </span>
      ),
    },
    {
      key: 'subject', label: '과목', sort: (s) => s.subject,
      render: (s) => <span className="chip" style={{ '--c': colorOf(s.subject) } as CSSProperties}>{s.subject}</span>,
    },
    { key: 'date', label: '날짜', sort: (s) => s.date, render: (s) => <span className="mono">{s.date}</span> },
    {
      key: 'time', label: '시간대', sort: (s) => s.start_time,
      text: (s) => `${isoHM(s.start_time)} ${isoHM(s.end_time)}`,
      render: (s) => (
        <span className="mono dim">
          {isoHM(s.start_time)} – {isoHM(s.end_time)}
        </span>
      ),
    },
    {
      key: 'duration', label: '공부 시간', num: true, sort: (s) => s.duration_seconds,
      text: (s) => fmtMinutes(s.duration_seconds / 60),
      render: (s) => <b className="strong">{fmtMinutes(s.duration_seconds / 60)}</b>,
    },
    {
      key: 'pause', label: '일시정지', num: true, sort: (s) => s.pause_count,
      render: (s) =>
        s.pause_count === 0 ? (
          <span className="dim">—</span>
        ) : (
          <span className="pause">
            {s.pause_count}회 <small>· {fmtMinutes(s.pause_seconds / 60)}</small>
          </span>
        ),
    },
  ];

  const studentCols: Column<Student>[] = [
    { key: 'id', label: 'ID', sort: (s) => s.id, render: (s) => <span className="mono dim">{s.id}</span> },
    {
      key: 'name', label: '이름', sort: (s) => s.name,
      render: (s) => (
        <span className="who">
          <i className="avatar">{s.name.slice(0, 1)}</i>
          {s.name}
        </span>
      ),
    },
    {
      key: 'count', label: '세션 수', num: true,
      sort: (s) => sessionCounts.get(s.id) ?? 0,
    },
    { key: 'created', label: '생성일', sort: (s) => s.created_at, render: (s) => <span className="mono dim">{isoLocal(s.created_at).slice(0, 16)}</span> },
  ];

  const subjectCols: Column<Subject>[] = [
    { key: 'order', label: '순서', num: true, sort: (s) => s.sort_order, render: (s) => <span className="dim">{s.sort_order}</span> },
    {
      key: 'name', label: '과목', sort: (s) => s.name,
      render: (s) => <span className="chip" style={{ '--c': s.color } as CSSProperties}>{s.name}</span>,
    },
    { key: 'goal', label: '목표', num: true, sort: (s) => s.goal_minutes, text: (s) => fmtMinutes(s.goal_minutes), render: (s) => fmtMinutes(s.goal_minutes) },
    {
      key: 'color', label: '색상', sort: (s) => s.color,
      render: (s) => (
        <span className="swatch">
          <i style={{ background: s.color }} />
          <span className="mono dim">{s.color}</span>
        </span>
      ),
    },
    {
      key: 'done', label: '오늘 상태', sort: (s) => s.done, text: (s) => DONE_LABEL[s.done],
      render: (s) => <span className={`badge done-${s.done}`}>{DONE_LABEL[s.done]}</span>,
    },
  ];

  // ── 현재 표: 검색 → 정렬 → 페이지 ──
  const { cols, data } = (
    table === 'students'
      ? { cols: studentCols, data: students }
      : table === 'subjects'
        ? { cols: subjectCols, data: subjects }
        : { cols: sessionCols, data: sessions }
  ) as { cols: Column<unknown>[]; data: unknown[] };

  const q = search.trim().toLowerCase();
  const filtered = q
    ? data.filter((r) => cols.some((c) => (c.text ? c.text(r) : String(c.sort(r))).toLowerCase().includes(q)))
    : data;

  const sortCol = cols.find((c) => c.key === sort?.key);
  const sorted = sortCol
    ? [...filtered].sort((a, b) => {
        const x = sortCol.sort(a);
        const y = sortCol.sort(b);
        const d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
        return sort!.dir === 'asc' ? d : -d;
      })
    : table === 'sessions'
      ? [...(filtered as SessionRecord[])].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
      : filtered;

  const totalPages = Math.max(Math.ceil(sorted.length / LIMIT), 1);
  const paged = sorted.slice(page * LIMIT, (page + 1) * LIMIT);
  const from = sorted.length ? page * LIMIT + 1 : 0;
  const to = Math.min((page + 1) * LIMIT, sorted.length);

  /** 현재 표의 행 → 상세 팝업 대상 */
  const targetOf = (r: unknown): DetailTarget =>
    table === 'students'
      ? { type: 'student', id: (r as Student).id }
      : table === 'subjects'
        ? { type: 'subject', id: (r as Subject).name }
        : { type: 'session', id: (r as SessionRecord).id };

  const toggleSort = (key: string) => {
    setPage(0);
    setSort((s) => (s?.key !== key ? { key, dir: 'desc' } : s.dir === 'desc' ? { key, dir: 'asc' } : null));
  };

  const closeDetail = useCallback(() => setDetail(null), []);

  // ── 데이터 관리 ──
  const handleDummy = async () => {
    if (!confirm('기존 데이터가 삭제되고 더미 데이터(학생 20명 × 90일)가 새로 생성됩니다. 계속하시겠습니까?')) return;
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
    a.download = `study-timer-data-${todayStr()}.json`;
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
    { name: 'sessions', label: '세션', count: sessions.length },
    { name: 'students', label: '학생', count: students.length },
    { name: 'subjects', label: '과목', count: subjects.length },
  ];

  const kpis = [
    { label: '총 세션', value: fmtNum(sessions.length), unit: '건' },
    { label: '학생', value: fmtNum(students.length), unit: '명' },
    { label: '누적 공부 시간', value: fmtNum(Math.round(grandTotal / 60)), unit: '시간' },
    {
      label: '기록 기간',
      value: dates.length ? fmtNum(dates.length) : '0',
      unit: '일',
      sub: dates.length ? `${dates[0]} ~ ${dates[dates.length - 1]}` : undefined,
    },
  ];

  return (
    <div className="data-main">
      {/* ── 헤더 ── */}
      <header className="data-head">
        <div>
          <h1>데이터 관리</h1>
          <p>이 브라우저(localStorage)에 저장된 학습 기록을 조회하고 관리합니다.</p>
        </div>
        <div className="data-toolbar">
          <button className="data-btn primary" onClick={handleDummy}>
            <Icon d="M4 4v5h5M20 20v-5h-5M5.1 15a7 7 0 0 0 12.6 2M18.9 9A7 7 0 0 0 6.3 7" />
            더미 데이터 재생성
          </button>
          <button className="data-btn" onClick={handleExport}>
            <Icon d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
            내보내기
          </button>
          <button className="data-btn" onClick={() => fileRef.current?.click()}>
            <Icon d="M12 15V4m0 0L8 8m4-4 4 4M5 19h14" />
            가져오기
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
          <button className="data-btn danger" onClick={handleReset}>
            <Icon d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
            전체 초기화
          </button>
        </div>
      </header>

      {/* ── 요약 지표 ── */}
      <section className="kpi-row">
        {kpis.map((k) => (
          <div key={k.label} className="kpi">
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-value">
              {k.value}
              <small>{k.unit}</small>
            </span>
            {k.sub && <span className="kpi-sub">{k.sub}</span>}
          </div>
        ))}
      </section>

      {/* ── 과목별 통계 ── */}
      <section className="data-card">
        <div className="card-title">
          <h3>과목별 통계</h3>
          <span className="card-hint">누적 공부 시간 순 · 행을 누르면 상세 보기</span>
        </div>
        <div className="table-wrap">
          <table className="data-table stats">
            <thead>
              <tr>
                <th>과목</th>
                <th className="share-col">누적 시간</th>
                <th className="num">세션</th>
                <th className="num">평균</th>
                <th className="num">최소</th>
                <th className="num">최대</th>
                <th className="num">평균 일시정지</th>
                <th className="num">학생</th>
              </tr>
            </thead>
            <tbody>
              {subjectStats.length === 0 ? (
                <tr><td colSpan={8} className="empty">데이터가 없습니다</td></tr>
              ) : (
                subjectStats.map((s) => {
                  const c = colorOf(s.subject);
                  return (
                    <tr
                      key={s.subject}
                      className="row-link"
                      tabIndex={0}
                      onClick={() => setDetail({ type: 'subject', id: s.subject })}
                      onKeyDown={(e) => e.key === 'Enter' && setDetail({ type: 'subject', id: s.subject })}
                    >
                      <td>
                        <span className="chip" style={{ '--c': c } as CSSProperties}>{s.subject}</span>
                      </td>
                      <td className="share-col">
                        <div className="share">
                          <div className="share-bar">
                            <i style={{ width: `${(s.total_minutes / maxTotal) * 100}%`, background: c }} />
                          </div>
                          <span className="share-val">{fmtNum(Math.round(s.total_minutes / 60))}시간</span>
                          <span className="share-pct">{Math.round((s.total_minutes / grandTotal) * 100)}%</span>
                        </div>
                      </td>
                      <td className="num">{fmtNum(s.session_count)}</td>
                      <td className="num strong">{s.avg_minutes}분</td>
                      <td className="num dim">{s.min_minutes}분</td>
                      <td className="num dim">{s.max_minutes}분</td>
                      <td className="num">{s.avg_pause_count}회</td>
                      <td className="num">{s.student_count}명</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 원본 테이블 ── */}
      <section className="data-card">
        <div className="records-head">
          <div className="seg">
            {tabs.map((t) => (
              <button
                key={t.name}
                className={`seg-btn${table === t.name ? ' active' : ''}`}
                onClick={() => {
                  setTable(t.name);
                  setPage(0);
                  setSort(null);
                }}
              >
                {t.label}
                <span className="cnt">{fmtNum(t.count)}</span>
              </button>
            ))}
          </div>
          <label className="data-search">
            <Icon d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm9 2-4-4" />
            <input
              placeholder="학생, 과목, 날짜로 검색"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
            />
            {search && (
              <button className="clear" onClick={() => setSearch('')} aria-label="검색어 지우기">×</button>
            )}
          </label>
        </div>

        <div className="table-wrap">
          <table className="data-table records">
            <thead>
              <tr>
                {cols.map((c) => {
                  const active = sort?.key === c.key;
                  return (
                    <th key={c.key} className={c.num ? 'num' : undefined}>
                      <button className={`th-sort${active ? ' active' : ''}`} onClick={() => toggleSort(c.key)}>
                        {c.label}
                        <span className="arrow">{active ? (sort!.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={cols.length} className="empty">
                    {q ? `"${search}"에 해당하는 데이터가 없습니다` : '데이터가 없습니다'}
                  </td>
                </tr>
              ) : (
                paged.map((r, i) => (
                  <tr
                    key={i}
                    className="row-link"
                    tabIndex={0}
                    onClick={() => setDetail(targetOf(r))}
                    onKeyDown={(e) => e.key === 'Enter' && setDetail(targetOf(r))}
                  >
                    {cols.map((c) => (
                      <td key={c.key} className={c.num ? 'num' : undefined}>
                        {c.render ? c.render(r) : c.sort(r)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="data-pager">
          <span className="data-meta">
            {fmtNum(sorted.length)}건 중 <b>{fmtNum(from)}–{fmtNum(to)}</b>
          </span>
          {totalPages > 1 && (
            <div className="pager-btns">
              <button className="pg" onClick={() => setPage(0)} disabled={page === 0} aria-label="처음">«</button>
              <button className="pg" onClick={() => setPage((p) => p - 1)} disabled={page === 0} aria-label="이전">‹</button>
              <span className="pg-now">
                {page + 1} / {totalPages}
              </span>
              <button className="pg" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages - 1} aria-label="다음">›</button>
              <button className="pg" onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} aria-label="마지막">»</button>
            </div>
          )}
        </footer>
      </section>

      {detail && (
        <DetailModal
          target={detail}
          sessions={sessions}
          students={students}
          subjects={subjects}
          colorOf={colorOf}
          onOpen={setDetail}
          onClose={closeDetail}
        />
      )}
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}
