'use client';

// 계획표 시각 계산의 기준 시각("지금")을 잡아 주는 훅.
//
// 매 렌더마다 new Date() 를 쓰면 타이머가 도는 동안 예상 시각이 1초마다 흔들립니다.
// 그래서 측정 중(running)에는 기준 시각을 고정해 두고, 멈춰 있을 때만 30초마다
// 갱신합니다. 측정이 끝나는 순간에도 한 번 갱신해서 다음 과목부터 다시 깔립니다.

import { useEffect, useState } from 'react';

const TICK_MS = 30_000;

export function useScheduleAnchor(running: boolean): Date {
  const [anchor, setAnchor] = useState(() => new Date());

  useEffect(() => {
    if (running) return; // 측정 중에는 고정
    setAnchor(new Date());
    const id = setInterval(() => setAnchor(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  return anchor;
}
