'use client';

// Chart.js 캔버스 래퍼: config가 바뀔 때마다 차트를 다시 생성합니다.
// (원본 dashboard.js 의 kill() + new Chart() 패턴과 동일)

import { useEffect, useRef } from 'react';
import Chart, { type ChartConfiguration } from 'chart.js/auto';

export default function ChartCanvas({ config }: { config: ChartConfiguration }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const chart = new Chart(canvasRef.current, config);
    return () => chart.destroy();
  }, [config]);

  return <canvas ref={canvasRef} />;
}
