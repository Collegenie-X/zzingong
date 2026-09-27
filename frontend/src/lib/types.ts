// ── 공용 타입 정의 ──
// Flask API(app.py)의 JSON 응답 형식과 1:1로 맞춰 두었습니다.
// 나중에 서버로 전환할 때 이 타입을 그대로 응답 스키마로 사용하면 됩니다.

export interface Student {
  id: string;
  name: string;
  created_at: string;
}

/** 0 = 미완료, 1 = 완료(10분 이상 공부), 2 = 건너뛰기 */
export type DoneState = 0 | 1 | 2;

export interface Subject {
  name: string;
  goal_minutes: number;
  color: string;
  done: DoneState;
  sort_order: number;
}

/** 과목 추가/수정 입력값 (sort_order·done 은 서버/스토어가 관리) */
export interface SubjectInput {
  name: string;
  goal_minutes: number;
  color: string;
}

export interface Distractions {
  phone: number;
  spacing: number;
  away: number;
  drowsy: number;
}

export interface SessionRecord {
  id: number;
  student_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  pause_count: number;
  pause_seconds: number;
  distraction_seconds: number;
  distraction_phone: number;
  distraction_spacing: number;
  distraction_away: number;
  distraction_drowsy: number;
  /** YYYY-MM-DD */
  date: string;
  created_at: string;
}

/** 세션 저장 요청 (POST /api/sessions/save 의 body와 동일) */
export interface SaveSessionInput {
  student_id: string;
  subject: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  pause_count: number;
  pause_seconds: number;
  distraction_seconds: number;
  distractions: Distractions;
}

// ── 대시보드 응답 (GET /api/dashboard 와 동일 구조) ──

export interface SubjectDayStat {
  study_seconds: number;
  pause_seconds: number;
  session_count: number;
  pause_count?: number;
}

export interface DailyStat {
  date: string;
  total_study_seconds: number;
  total_pause_seconds: number;
  total_elapsed_seconds: number;
  session_count: number;
  by_subject: Record<string, SubjectDayStat>;
}

export interface SubjectSummary {
  name: string;
  color: string;
  goal_minutes: number;
  today_study_minutes: number;
  today_pause_minutes: number;
  today_sessions: number;
  achievement_rate: number;
  achievement_raw: number;
  change_minutes: number;
  change_percent: number;
  week_total_minutes: number;
  week_avg_minutes: number;
  history: { date: string; study_seconds: number; pause_seconds: number; session_count: number }[];
  status: 'done' | 'active' | 'idle';
}

export interface ClassAvgDaily {
  avg_study_minutes: number;
  avg_pause_minutes: number;
  top_study_minutes: number;
  bottom_study_minutes: number;
}

export interface ClassAvg {
  class_size: number;
  daily: Record<string, ClassAvgDaily>;
  subject_daily: Record<string, Record<string, { avg_study_minutes: number; top_study_minutes: number }>>;
}

export interface DashboardOverview {
  today_study_seconds: number;
  today_pause_seconds: number;
  today_elapsed_seconds: number;
  today_sessions: number;
  today_focus_rate: number;
  subjects_done: number;
  subjects_total: number;
  week_total_seconds: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  subjects: SubjectSummary[];
  daily: DailyStat[];
  class_avg: ClassAvg;
}
