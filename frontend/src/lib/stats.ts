// ── 대시보드 통계 계산 (app.py get_dashboard / build_subject_summary / calc_class_avg 포팅) ──
// 서버로 전환하면 이 계산은 서버 쪽으로 이동하고,
// 프론트는 DashboardData JSON만 받아서 그리면 됩니다.

import { daysAgoStr } from './format';
import type {
  ClassAvg,
  DailyStat,
  DashboardData,
  SessionRecord,
  Student,
  Subject,
  SubjectDayStat,
  SubjectSummary,
} from './types';

export function buildDashboard(
  days: number,
  studentId: string,
  subjects: Subject[],
  students: Student[],
  allSessions: SessionRecord[],
): DashboardData {
  const startDate = daysAgoStr(days - 1);

  // 내 세션을 날짜/과목별로 집계
  const myData = new Map<string, Map<string, { study: number; pause: number; cnt: number; pcnt: number }>>();
  if (studentId) {
    for (const s of allSessions) {
      if (s.student_id !== studentId || s.date < startDate) continue;
      let byDate = myData.get(s.date);
      if (!byDate) myData.set(s.date, (byDate = new Map()));
      const cur = byDate.get(s.subject) ?? { study: 0, pause: 0, cnt: 0, pcnt: 0 };
      cur.study += s.duration_seconds;
      cur.pause += s.pause_seconds;
      cur.cnt += 1;
      cur.pcnt += s.pause_count;
      byDate.set(s.subject, cur);
    }
  }

  // daily[0] = 오늘, daily[days-1] = 가장 오래된 날 (원본과 동일)
  const daily: DailyStat[] = [];
  for (let i = 0; i < days; i++) {
    const ds = daysAgoStr(i);
    const day = myData.get(ds) ?? new Map();
    let total = 0;
    let totalPause = 0;
    let cnt = 0;
    const bySubject: DailyStat['by_subject'] = {};
    for (const [name, v] of day) {
      total += v.study;
      totalPause += v.pause;
      cnt += v.cnt;
      bySubject[name] = {
        study_seconds: v.study,
        pause_seconds: v.pause,
        session_count: v.cnt,
        pause_count: v.pcnt,
      };
    }
    daily.push({
      date: ds,
      total_study_seconds: total,
      total_pause_seconds: totalPause,
      total_elapsed_seconds: total + totalPause,
      session_count: cnt,
      by_subject: bySubject,
    });
  }

  const subjectSummary = buildSubjectSummary(subjects, daily);

  const td = daily[0];
  const focusRate =
    td.total_elapsed_seconds > 0
      ? Math.round((td.total_study_seconds / td.total_elapsed_seconds) * 100)
      : 0;
  const doneCount = subjectSummary.filter((s) => s.status === 'done').length;

  return {
    overview: {
      today_study_seconds: td.total_study_seconds,
      today_pause_seconds: td.total_pause_seconds,
      today_elapsed_seconds: td.total_elapsed_seconds,
      today_sessions: td.session_count,
      today_focus_rate: focusRate,
      subjects_done: doneCount,
      subjects_total: subjects.length,
      week_total_seconds: daily.slice(0, 7).reduce((a, d) => a + d.total_study_seconds, 0),
    },
    subjects: subjectSummary,
    daily: [...daily].reverse(),
    class_avg: calcClassAvg(startDate, subjects, students, allSessions),
  };
}

function buildSubjectSummary(subjects: Subject[], daily: DailyStat[]): SubjectSummary[] {
  return subjects.map((subj) => {
    const name = subj.name;
    const empty: Partial<SubjectDayStat> = {};
    const history = [...daily].reverse().map((day) => {
      const ds = day.by_subject[name] ?? empty;
      return {
        date: day.date,
        study_seconds: ds.study_seconds ?? 0,
        pause_seconds: ds.pause_seconds ?? 0,
        session_count: ds.session_count ?? 0,
      };
    });
    const todayData = daily[0].by_subject[name] ?? empty;
    const yesterdayData = daily.length > 1 ? daily[1].by_subject[name] ?? empty : empty;
    const todayMin = (todayData.study_seconds ?? 0) / 60;
    const yesterdayMin = (yesterdayData.study_seconds ?? 0) / 60;
    const goal = subj.goal_minutes;
    const achievementRate = goal > 0 ? Math.round((todayMin / goal) * 100) : 0;
    const change = Math.round(todayMin - yesterdayMin);
    const changePct =
      yesterdayMin > 0
        ? Math.round(((todayMin - yesterdayMin) / yesterdayMin) * 100)
        : todayMin > 0
          ? 100
          : 0;
    const weekTotal = daily
      .slice(0, 7)
      .reduce((a, d) => a + (d.by_subject[name]?.study_seconds ?? 0), 0);
    const weekAvg = Math.round(weekTotal / Math.min(daily.length, 7) / 60);
    return {
      name,
      color: subj.color,
      goal_minutes: goal,
      today_study_minutes: Math.round(todayMin),
      today_pause_minutes: Math.round((todayData.pause_seconds ?? 0) / 60),
      today_sessions: todayData.session_count ?? 0,
      achievement_rate: Math.min(achievementRate, 100),
      achievement_raw: achievementRate,
      change_minutes: change,
      change_percent: changePct,
      week_total_minutes: Math.round(weekTotal / 60),
      week_avg_minutes: weekAvg,
      history,
      status: achievementRate >= 100 ? 'done' : todayMin > 0 ? 'active' : 'idle',
    };
  });
}

function calcClassAvg(
  startDate: string,
  subjects: Subject[],
  students: Student[],
  allSessions: SessionRecord[],
): ClassAvg {
  const result: ClassAvg = {
    class_size: students.length,
    daily: {},
    subject_daily: Object.fromEntries(subjects.map((s) => [s.name, {}])),
  };

  // 학생×날짜별 합계 → 날짜별 평균/최고/최저
  const perStudentDay = new Map<string, { study: number; pause: number }>();
  const perStudentSubjDay = new Map<string, number>();
  for (const s of allSessions) {
    if (s.date < startDate) continue;
    const dk = `${s.student_id}|${s.date}`;
    const cur = perStudentDay.get(dk) ?? { study: 0, pause: 0 };
    cur.study += s.duration_seconds / 60;
    cur.pause += s.pause_seconds / 60;
    perStudentDay.set(dk, cur);

    const sk = `${s.student_id}|${s.subject}|${s.date}`;
    perStudentSubjDay.set(sk, (perStudentSubjDay.get(sk) ?? 0) + s.duration_seconds / 60);
  }

  const byDate = new Map<string, { study: number[]; pause: number[] }>();
  for (const [key, v] of perStudentDay) {
    const date = key.split('|')[1];
    let bucket = byDate.get(date);
    if (!bucket) byDate.set(date, (bucket = { study: [], pause: [] }));
    bucket.study.push(v.study);
    bucket.pause.push(v.pause);
  }
  for (const [date, b] of byDate) {
    const avg = (arr: number[]) => arr.reduce((a, x) => a + x, 0) / arr.length;
    result.daily[date] = {
      avg_study_minutes: Math.round(avg(b.study)),
      avg_pause_minutes: Math.round(avg(b.pause)),
      top_study_minutes: Math.round(Math.max(...b.study)),
      bottom_study_minutes: Math.round(Math.min(...b.study)),
    };
  }

  const bySubjDate = new Map<string, number[]>();
  for (const [key, min] of perStudentSubjDay) {
    const [, subject, date] = key.split('|');
    const bk = `${subject}|${date}`;
    const arr = bySubjDate.get(bk) ?? [];
    arr.push(min);
    bySubjDate.set(bk, arr);
  }
  for (const [key, arr] of bySubjDate) {
    const [subject, date] = key.split('|');
    if (!(subject in result.subject_daily)) continue;
    result.subject_daily[subject][date] = {
      avg_study_minutes: Math.round(arr.reduce((a, x) => a + x, 0) / arr.length),
      top_study_minutes: Math.round(Math.max(...arr)),
    };
  }

  return result;
}
