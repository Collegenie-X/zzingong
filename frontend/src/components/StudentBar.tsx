'use client';

// 학생 선택/추가/수정/삭제 바 (원본 index.html 학생 CRUD 포팅)

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Student } from '@/lib/types';

interface Props {
  studentId: string;
  onChange: (id: string) => void;
  /** 추가/수정/삭제 버튼 표시 여부 (대시보드는 선택만) */
  editable?: boolean;
  /** 학생 데이터가 바뀌었을 때(삭제 등) 부모가 다시 로드하도록 알림 */
  onMutate?: () => void;
}

export default function StudentBar({ studentId, onChange, editable = false, onMutate }: Props) {
  const [students, setStudents] = useState<Student[]>([]);

  const reload = useCallback(async () => {
    const list = await api.getStudents();
    setStudents(list);
    return list;
  }, []);

  useEffect(() => {
    reload().then((list) => {
      // 저장된 학생이 삭제된 경우 선택 해제
      if (studentId && !list.some((s) => s.id === studentId)) onChange('');
    });
  }, [reload, studentId, onChange]);

  const handleAdd = async () => {
    const name = prompt('학생 이름을 입력하세요:');
    if (!name) return;
    const res = await api.addStudent(name);
    if (!res.ok) return alert(res.error);
    await reload();
    onChange(res.id!);
    onMutate?.();
  };

  const handleEdit = async () => {
    if (!studentId) return alert('학생을 먼저 선택해주세요');
    const name = prompt('새 이름을 입력하세요:');
    if (!name) return;
    const res = await api.editStudent(studentId, name);
    if (!res.ok) return alert(res.error);
    await reload();
  };

  const handleDelete = async () => {
    if (!studentId) return alert('학생을 먼저 선택해주세요');
    if (!confirm('이 학생의 모든 데이터가 삭제됩니다. 계속하시겠습니까?')) return;
    await api.deleteStudent(studentId);
    await reload();
    onChange('');
    onMutate?.();
  };

  return (
    <div className="student-bar">
      <label>학생:</label>
      <select value={studentId} onChange={(e) => onChange(e.target.value)}>
        <option value="">-- 선택 --</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      {editable && (
        <>
          <button className="stu-btn" onClick={handleAdd}>+ 추가</button>
          <button className="stu-btn" onClick={handleEdit}>수정</button>
          <button className="stu-btn del" onClick={handleDelete}>삭제</button>
        </>
      )}
      <span className="stu-count">({students.length}명)</span>
    </div>
  );
}
