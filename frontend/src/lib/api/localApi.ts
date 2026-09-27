// ── StudyApi 의 localStorage 구현 ──
// 첫 실행 시 src/data/subjects.json 시드 과목과
// 더미 학생/세션(반 평균 비교용)을 자동 생성합니다.

import planConfig from '@/data/subjects.json';
import { generateComment } from '../comment';
import { generateDummyData } from '../dummy';
import { todayStr } from '../format';
import { shortId } from '../random';
import { buildDashboard } from '../stats';
import { KEYS, clearAll, readJSON, writeJSON } from '../storage';
import type { DoneState, SessionRecord, Student, Subject, SubjectInput } from '../types';
import type { StudyApi } from './types';

// ── 내부 헬퍼 ──

const seedSubjects = planConfig.subjects as Subject[];

/** 과목 추가/수정 입력값 검증 후 정규화 */
function normalizeInput(
  input: SubjectInput,
  subjects: Subject[],
  excludeName?: string,
): { error: string } | { value: SubjectInput } {
  const name = input.name.trim();
  if (!name) return { error: '과목 이름을 입력해주세요' };
  if (name.length > 12) return { error: '과목 이름은 12자 이하로 입력해주세요' };
  if (subjects.some((s) => s.name === name && s.name !== excludeName))
    return { error: '이미 있는 과목입니다' };

  const goal = Math.round(Number(input.goal_minutes));
  if (!Number.isFinite(goal) || goal < 5 || goal > 600)
    return { error: '목표 시간은 5분 ~ 600분 사이로 입력해주세요' };

  const color = input.color.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: '색상 형식이 올바르지 않습니다' };

  return { value: { name, goal_minutes: goal, color } };
}

function loadSubjects(): Subject[] {
  return readJSON<Subject[]>(KEYS.subjects, []);
}
function loadStudents(): Student[] {
  return readJSON<Student[]>(KEYS.students, []);
}
function loadSessions(): SessionRecord[] {
  return readJSON<SessionRecord[]>(KEYS.sessions, []);
}

function ensureSeed(): void {
  if (typeof window === 'undefined') return;
  if (readJSON<boolean>(KEYS.seeded, false)) return;
  const subjects = seedSubjects as Subject[];
  writeJSON(KEYS.subjects, subjects);
  const { students, sessions } = generateDummyData(subjects);
  writeJSON(KEYS.students, students);
  writeJSON(KEYS.sessions, sessions);
  writeJSON(KEYS.seeded, true);
}

function nextSessionId(sessions: SessionRecord[]): number {
  return sessions.reduce((max, s) => Math.max(max, s.id), 0) + 1;
}

// ── 구현 ──

export const localApi: StudyApi = {
  async getStudents() {
    ensureSeed();
    return [...loadStudents()].sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async addStudent(name) {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: '이름을 입력해주세요' };
    const students = loadStudents();
    if (students.some((s) => s.name === trimmed))
      return { ok: false, error: '이미 존재하는 학생입니다' };
    const id = shortId(`${trimmed}_${todayStr()}_${Date.now()}`);
    students.push({ id, name: trimmed, created_at: new Date().toISOString() });
    writeJSON(KEYS.students, students);
    return { ok: true, id, name: trimmed };
  },

  async editStudent(id, name) {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: '이름을 입력해주세요' };
    const students = loadStudents();
    if (students.some((s) => s.name === trimmed && s.id !== id))
      return { ok: false, error: '이미 존재하는 이름입니다' };
    const target = students.find((s) => s.id === id);
    if (target) target.name = trimmed;
    writeJSON(KEYS.students, students);
    return { ok: true };
  },

  async deleteStudent(id) {
    writeJSON(KEYS.students, loadStudents().filter((s) => s.id !== id));
    writeJSON(KEYS.sessions, loadSessions().filter((s) => s.student_id !== id));
    return { ok: true };
  },

  async getSubjects() {
    ensureSeed();
    return [...loadSubjects()].sort((a, b) => a.sort_order - b.sort_order);
  },

  async addSubject(input) {
    ensureSeed();
    const subjects = loadSubjects();
    const check = normalizeInput(input, subjects);
    if ('error' in check) return { ok: false, error: check.error };

    const subject: Subject = {
      ...check.value,
      done: 0,
      sort_order: subjects.reduce((max, s) => Math.max(max, s.sort_order), -1) + 1,
    };
    subjects.push(subject);
    writeJSON(KEYS.subjects, subjects);
    return { ok: true, subject };
  },

  async editSubject(name, input) {
    const subjects = loadSubjects();
    const target = subjects.find((s) => s.name === name);
    if (!target) return { ok: false, error: '과목을 찾을 수 없습니다' };

    const check = normalizeInput(input, subjects, name);
    if ('error' in check) return { ok: false, error: check.error };

    // 이름이 바뀌면 지난 기록도 함께 옮겨 통계가 끊기지 않게 합니다.
    if (check.value.name !== name) {
      const sessions = loadSessions();
      let touched = false;
      for (const rec of sessions) {
        if (rec.subject === name) {
          rec.subject = check.value.name;
          touched = true;
        }
      }
      if (touched) writeJSON(KEYS.sessions, sessions);
    }

    Object.assign(target, check.value);
    writeJSON(KEYS.subjects, subjects);
    return { ok: true, subject: { ...target } };
  },

  async deleteSubject(name) {
    const subjects = loadSubjects();
    if (!subjects.some((s) => s.name === name))
      return { ok: false, error: '과목을 찾을 수 없습니다' };
    // 계획에서만 빼고 공부 기록은 남겨 둡니다.
    const next = subjects
      .filter((s) => s.name !== name)
      .map((s, i) => ({ ...s, sort_order: i }));
    writeJSON(KEYS.subjects, next);
    return { ok: true };
  },

  async reorderSubjects(order) {
    const subjects = loadSubjects();
    for (const s of subjects) {
      const idx = order.indexOf(s.name);
      if (idx >= 0) s.sort_order = idx;
    }
    writeJSON(KEYS.subjects, subjects);
    return { ok: true };
  },

  async toggleDone(name, studentId) {
    const subjects = loadSubjects();
    const subj = subjects.find((s) => s.name === name);
    if (!subj) return { ok: false, error: '과목을 찾을 수 없습니다' };

    if (subj.done !== 0) {
      subj.done = 0;
      writeJSON(KEYS.subjects, subjects);
      return { ok: true, done: 0, status: 'none' };
    }

    // 오늘 10분(600초) 이상 공부했으면 '완료', 아니면 '건너뛰기'
    let studySec = 0;
    if (studentId) {
      const today = todayStr();
      studySec = loadSessions()
        .filter((s) => s.student_id === studentId && s.subject === name && s.date === today)
        .reduce((a, s) => a + s.duration_seconds, 0);
    }
    const newDone: DoneState = studySec >= 600 ? 1 : 2;
    subj.done = newDone;
    writeJSON(KEYS.subjects, subjects);
    return { ok: true, done: newDone, status: newDone === 1 ? 'done' : 'skipped' };
  },

  async saveSession(input) {
    if (!input.student_id) return { ok: false, error: 'student_id가 필요합니다' };
    const sessions = loadSessions();
    const today = todayStr();
    const d = input.distractions;
    sessions.push({
      id: nextSessionId(sessions),
      student_id: input.student_id,
      subject: input.subject,
      start_time: input.start_time,
      end_time: input.end_time,
      duration_seconds: input.duration_seconds,
      pause_count: input.pause_count,
      pause_seconds: input.pause_seconds,
      distraction_seconds: input.distraction_seconds,
      distraction_phone: d.phone,
      distraction_spacing: d.spacing,
      distraction_away: d.away,
      distraction_drowsy: d.drowsy,
      date: today,
      created_at: new Date().toISOString(),
    });
    writeJSON(KEYS.sessions, sessions);

    const allToday = sessions.filter((s) => s.student_id === input.student_id && s.date === today);
    return { ok: true, comment: generateComment(input, allToday) };
  },

  async getTodaySessions(studentId) {
    if (!studentId) return [];
    const today = todayStr();
    return loadSessions()
      .filter((s) => s.student_id === studentId && s.date === today)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  },

  async getDashboard(days, studentId) {
    ensureSeed();
    return buildDashboard(days, studentId, await this.getSubjects(), loadStudents(), loadSessions());
  },

  async getAllSessions() {
    ensureSeed();
    return loadSessions();
  },

  async regenerateDummy() {
    const subjects = seedSubjects as Subject[];
    writeJSON(KEYS.subjects, subjects);
    const { students, sessions } = generateDummyData(subjects);
    writeJSON(KEYS.students, students);
    writeJSON(KEYS.sessions, sessions);
    writeJSON(KEYS.seeded, true);
    return { ok: true };
  },

  async resetAll() {
    clearAll();
    return { ok: true };
  },

  async exportAll() {
    ensureSeed();
    return JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        subjects: loadSubjects(),
        students: loadStudents(),
        sessions: loadSessions(),
      },
      null,
      2,
    );
  },

  async importAll(json) {
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data.subjects) || !Array.isArray(data.students) || !Array.isArray(data.sessions))
        return { ok: false, error: 'subjects / students / sessions 배열이 필요합니다' };
      writeJSON(KEYS.subjects, data.subjects);
      writeJSON(KEYS.students, data.students);
      writeJSON(KEYS.sessions, data.sessions);
      writeJSON(KEYS.seeded, true);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: `JSON 파싱 실패: ${e instanceof Error ? e.message : e}` };
    }
  },
};
