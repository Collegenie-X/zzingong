// ── API 인터페이스 ──
// Flask 엔드포인트(app.py)와 1:1 대응합니다.
// 지금은 localApi(localStorage)가 구현하고,
// 서버가 생기면 같은 인터페이스로 fetch 기반 serverApi를 만들어 교체하면 됩니다.

import type {
  DashboardData,
  DoneState,
  SaveSessionInput,
  SessionRecord,
  Student,
  Subject,
  SubjectInput,
} from '../types';

export interface ApiResult {
  ok: boolean;
  error?: string;
}

export interface StudyApi {
  // 학생 CRUD  (GET /api/students, POST /api/students/{add,edit,delete})
  getStudents(): Promise<Student[]>;
  addStudent(name: string): Promise<ApiResult & { id?: string; name?: string }>;
  editStudent(id: string, name: string): Promise<ApiResult>;
  deleteStudent(id: string): Promise<ApiResult>;

  // 과목  (GET /api/subjects, POST /api/subjects/{add,edit,delete,reorder,toggle_done})
  getSubjects(): Promise<Subject[]>;
  addSubject(input: SubjectInput): Promise<ApiResult & { subject?: Subject }>;
  editSubject(name: string, input: SubjectInput): Promise<ApiResult & { subject?: Subject }>;
  deleteSubject(name: string): Promise<ApiResult>;
  reorderSubjects(order: string[]): Promise<ApiResult>;
  toggleDone(name: string, studentId: string): Promise<ApiResult & { done?: DoneState; status?: string }>;

  // 세션  (POST /api/sessions/save, GET /api/sessions/today)
  saveSession(input: SaveSessionInput): Promise<ApiResult & { comment?: string }>;
  getTodaySessions(studentId: string): Promise<SessionRecord[]>;

  // 대시보드  (GET /api/dashboard)
  getDashboard(days: number, studentId: string): Promise<DashboardData>;

  // 데이터 관리 (로컬 전용 — 서버 전환 시 관리자 API로 대체)
  getAllSessions(): Promise<SessionRecord[]>;
  regenerateDummy(): Promise<ApiResult>;
  resetAll(): Promise<ApiResult>;
  exportAll(): Promise<string>;
  importAll(json: string): Promise<ApiResult>;
}
