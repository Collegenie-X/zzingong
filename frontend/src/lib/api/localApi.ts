// ── StudyApi 의 localStorage 구현 ──
// 첫 실행 시 src/data/subjects.json 시드 과목과
// 더미 학생/세션(반 평균 비교용)을 자동 생성합니다.

import seedSubjects from '@/data/subjects.json';
import { generateComment } from '../comment';
import { generateDummyData } from '../dummy';
import { todayStr } from '../format';
import { shortId } from '../random';
import { buildDashboard } from '../stats';
import { KEYS, clearAll, readJSON, writeJSON } from '../storage';
import type { DoneState, SessionRecord, Student, Subject } from '../types';
import type { StudyApi } from './types';

// ── 내부 헬퍼 ──

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
