'use client';

// 선택된 학생 ID를 localStorage와 동기화하는 훅 (타이머/대시보드 페이지 공용)

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { KEYS } from '@/lib/storage';

export function useSelectedStudent(): [string, (id: string) => void] {
  const [studentId, setStudentIdState] = useState('');

  useEffect(() => {
    // 첫 실행이면 더미 데이터가 만들어지며 '나' 학생이 선택되므로, 학생 목록을 먼저 불러온 뒤 읽습니다
    api.getStudents().then(() => {
      try {
        setStudentIdState(window.localStorage.getItem(KEYS.selectedStudent) ?? '');
      } catch {
        // ignore
      }
    });
  }, []);

  const setStudentId = useCallback((id: string) => {
    setStudentIdState(id);
    try {
      if (id) window.localStorage.setItem(KEYS.selectedStudent, id);
      else window.localStorage.removeItem(KEYS.selectedStudent);
    } catch {
      // ignore
    }
  }, []);

  return [studentId, setStudentId];
}
