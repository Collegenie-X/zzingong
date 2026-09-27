'use client';

// 대시보드 페이지 (원본 templates/dashboard.html + static/js/dashboard.js 포팅)

import { useCallback, useEffect, useState } from 'react';
import StudentBar from '@/components/StudentBar';
import CompareSection from '@/components/dashboard/CompareSection';
import GapSection from '@/components/dashboard/GapSection';
import OverviewRow from '@/components/dashboard/OverviewRow';
import ReportSection from '@/components/dashboard/ReportSection';
import StackedSection from '@/components/dashboard/StackedSection';
import { useSelectedStudent } from '@/hooks/useSelectedStudent';
import { api } from '@/lib/api';
import type { DashboardData } from '@/lib/types';
import '@/styles/dashboard.css';

export default function DashboardPage() {
  const [studentId, setStudentId] = useSelectedStudent();
  const [data, setData] = useState<DashboardData | null>(null);
  const [curSubj, setCurSubj] = useState('all');
  const [curPeriod, setCurPeriod] = useState(7);

  const load = useCallback(async () => {
    setData(await api.getDashboard(90, studentId));
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  // 대시보드 페이지에서는 어두운 배경 톤 적용 (원본 dashboard.css body 색)
  useEffect(() => {
    document.body.classList.add('dash-body');
    return () => document.body.classList.remove('dash-body');
  }, []);

  if (!data) {
    return (
      <>
        <StudentBar studentId={studentId} onChange={setStudentId} />
        <div className="dash-main" style={{ color: '#64748b', textAlign: 'center', paddingTop: 60 }}>
          불러오는 중...
        </div>
      </>
    );
  }

  const sliced = data.daily.slice(-curPeriod);
  const dates = sliced.map((d) => d.date);

  return (
    <>
      <StudentBar studentId={studentId} onChange={setStudentId} onMutate={load} />
      <div className="dash-main">
        <OverviewRow data={data} sliced={sliced} dates={dates} curSubj={curSubj} />
        <CompareSection
          data={data}
          sliced={sliced}
          dates={dates}
          curSubj={curSubj}
          curPeriod={curPeriod}
          onSelectSubj={setCurSubj}
          onSelectPeriod={setCurPeriod}
        />
        <StackedSection data={data} />
        <GapSection data={data} />
        <ReportSection data={data} sliced={sliced} dates={dates} curPeriod={curPeriod} />
      </div>
    </>
  );
}
