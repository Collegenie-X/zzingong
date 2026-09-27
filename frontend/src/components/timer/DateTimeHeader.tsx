'use client';

// 상단 현재 날짜/시각/남은 시간 표시 (1초마다 갱신)

import { useEffect, useState } from 'react';
import { WEEKDAYS } from '@/lib/format';

export default function DateTimeHeader() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) return <div className="datetime-header" style={{ minHeight: 86 }} />;

  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const remainMin = Math.floor((midnight.getTime() - now.getTime()) / 60000);

  return (
    <div className="datetime-header">
      <div className="date">
        {now.getFullYear()}년 {now.getMonth() + 1}월 {now.getDate()}일 ({WEEKDAYS[now.getDay()]})
      </div>
      <div className="time">
        {now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
      </div>
      <div className="remaining">
        오늘 남은 시간: {Math.floor(remainMin / 60)}시간 {remainMin % 60}분
      </div>
    </div>
  );
}
