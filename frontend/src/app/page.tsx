'use client';

// 타이머 페이지 (원본 templates/index.html 포팅)

import { useCallback, useEffect, useRef, useState } from 'react';
import StudentBar from '@/components/StudentBar';
import DateTimeHeader from '@/components/timer/DateTimeHeader';
import MonitorPanel, { MonitorHandle } from '@/components/timer/MonitorPanel';
import PlanList from '@/components/timer/PlanList';
import TimerPanel from '@/components/timer/TimerPanel';
import TodayLog from '@/components/timer/TodayLog';
import { useSelectedStudent } from '@/hooks/useSelectedStudent';
import { api } from '@/lib/api';
import { calcTimes } from '@/lib/plan';
import type { SessionRecord, Subject } from '@/lib/types';
import '@/styles/timer.css';

export default function TimerPage() {
  const [studentId, setStudentId] = useSelectedStudent();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [comment, setComment] = useState('');

  const pauseSecRef = useRef(0);
  const pauseStartRef = useRef<number | null>(null);
  const startTimeRef = useRef<string | null>(null);
  const monitorRef = useRef<MonitorHandle>(null);
  const subjectsRef = useRef<Subject[]>([]);
  subjectsRef.current = subjects;

  // ── 데이터 로드 ──
  const loadSubjects = useCallback(async () => {
    setSubjects(await api.getSubjects());
  }, []);

  const loadSessions = useCallback(async () => {
    setSessions(studentId ? await api.getTodaySessions(studentId) : []);
  }, [studentId]);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── 1초 타이머 ──
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  // ── 타이머 조작 ──
  const startTimer = () => {
    if (running || !selected) return;
    if (!studentId) {
      alert('학생을 먼저 선택해주세요');
      return;
    }
    if (!startTimeRef.current) {
      startTimeRef.current = new Date().toISOString();
      setStarted(true);
    }
    if (pauseStartRef.current) {
      pauseSecRef.current += Math.floor((Date.now() - pauseStartRef.current) / 1000);
      pauseStartRef.current = null;
    }
    setComment('');
    setRunning(true);
  };

  const pauseTimer = () => {
    if (!running) return;
    setRunning(false);
    setPauseCount((c) => c + 1);
    pauseStartRef.current = Date.now();
  };

  const stopTimer = async () => {
    setRunning(false);
    if (pauseStartRef.current) {
      pauseSecRef.current += Math.floor((Date.now() - pauseStartRef.current) / 1000);
      pauseStartRef.current = null;
    }
    const endTime = new Date().toISOString();
    const distractions = monitorRef.current?.getDistractions() ?? {
      phone: 0,
      spacing: 0,
      away: 0,
      drowsy: 0,
    };
    const totalDist =
      distractions.phone + distractions.spacing + distractions.away + distractions.drowsy;

    if (elapsed > 0 && selected && startTimeRef.current) {
      const res = await api.saveSession({
        student_id: studentId,
        subject: selected,
        start_time: startTimeRef.current,
        end_time: endTime,
        duration_seconds: elapsed,
        pause_count: pauseCount,
        pause_seconds: pauseSecRef.current,
        distraction_seconds: totalDist,
        distractions,
      });
      if (res.comment) setComment(res.comment);
      loadSessions();
    }

    setStarted(false);
    setElapsed(0);
    setPauseCount(0);
    pauseSecRef.current = 0;
    startTimeRef.current = null;
  };

  // ── 과목 조작 ──
  const handleToggleDone = async (name: string) => {
    const res = await api.toggleDone(name, studentId);
    if (res.ok && res.done !== undefined) {
      setSubjects((prev) => prev.map((s) => (s.name === name ? { ...s, done: res.done! } : s)));
    }
  };

  const handleReorder = (next: Subject[]) => {
    setSubjects(next);
    api.reorderSubjects(next.map((s) => s.name));
  };

  // ── 예정 시간이 지난 과목 자동 완료 (30초마다 점검) ──
  useEffect(() => {
    const check = () => {
      const list = subjectsRef.current;
      const now = new Date();
      const times = calcTimes(list, now);
      list.forEach((s, i) => {
        if (s.done !== 0) return;
        const [eh, em] = times[i].end.split(':').map(Number);
        const endDate = new Date(now);
        endDate.setHours(eh, em, 0, 0);
        if (!times[i].overMidnight && now >= endDate) handleToggleDone(s.name);
      });
    };
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // ── 계획 카드/타이머 버튼 밖을 클릭하면 선택 해제 ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (running || !selected) return;
      const target = e.target as HTMLElement;
      if (target.closest('[data-plan-card]') || target.closest('.timer-buttons')) return;
      setSelected(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [running, selected]);

  return (
    <>
      <StudentBar studentId={studentId} onChange={setStudentId} editable onMutate={loadSessions} />
      <DateTimeHeader />
      <div className="timer-main">
        <PlanList
          subjects={subjects}
          selected={selected}
          running={running}
          onSelect={(name) => setSelected((cur) => (cur === name ? null : name))}
          onDeselect={() => !running && setSelected(null)}
          onToggleDone={handleToggleDone}
          onReorder={handleReorder}
        />
        <div>
          <TimerPanel
            subjects={subjects}
            selected={selected}
            elapsed={elapsed}
            running={running}
            pauseCount={pauseCount}
            started={started}
            comment={comment}
            onStart={startTimer}
            onPause={pauseTimer}
            onStop={stopTimer}
          />
          <TodayLog sessions={sessions} subjects={subjects} hidden={started} />
          <MonitorPanel ref={monitorRef} active={started} running={running} />
        </div>
      </div>
    </>
  );
}
