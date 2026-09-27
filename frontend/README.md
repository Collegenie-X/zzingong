# 📚 Study Timer Frontend (Next.js)

Flask + SQLite로 만든 `study-timer`를 **Next.js(App Router) + TypeScript**로 포팅한 프론트엔드입니다.
서버 없이 **localStorage + JSON 시드 파일**만으로 동작하며, 나중에 서버를 붙이기 쉽게 데이터 계층을 분리해 두었습니다.

## 실행 방법

```bash
cd frontend
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속.

| 주소 | 화면 |
|------|------|
| `/` | 타이머 (과목 계획, 타이머, 웹캠 모니터링, 오늘 기록) |
| `/dashboard` | 대시보드 (나 vs 반 평균, 누적 차트, AI 학습 보고서) |
| `/data` | 데이터 뷰어 (테이블 조회, 더미 재생성, JSON 내보내기/가져오기) |

첫 실행 시 `src/data/subjects.json`의 기본 과목과, 반 평균 비교용 **더미 학생 20명 × 30일 세션**이
자동으로 localStorage에 생성됩니다. (`/data` 페이지에서 재생성/초기화 가능)

## 폴더 구조

```
frontend/src/
├── app/                       ← 페이지 (Next.js App Router)
│   ├── page.tsx               ← 타이머 페이지
│   ├── dashboard/page.tsx     ← 대시보드 페이지
│   ├── data/page.tsx          ← 데이터 뷰어 페이지
│   ├── layout.tsx             ← 공통 레이아웃 (네비게이션)
│   └── globals.css            ← 공통 스타일
│
├── components/
│   ├── Nav.tsx                ← 상단 네비게이션
│   ├── StudentBar.tsx         ← 학생 선택/추가/수정/삭제 바
│   ├── timer/                 ← 타이머 페이지 컴포넌트
│   │   ├── DateTimeHeader.tsx ← 현재 시각/남은 시간
│   │   ├── PlanList.tsx       ← 공부 계획 (드래그 정렬, 완료 토글)
│   │   ├── TimerPanel.tsx     ← 타이머 표시/버튼/AI 코멘트
│   │   ├── TodayLog.tsx       ← 오늘의 기록 테이블
│   │   └── MonitorPanel.tsx   ← 웹캠 모니터링 + 딴짓 태깅
│   └── dashboard/             ← 대시보드 섹션별 컴포넌트
│       ├── ChartCanvas.tsx    ← Chart.js 래퍼
│       ├── OverviewRow.tsx    ← 상단 요약 카드
│       ├── CompareSection.tsx ← 나 vs 반 평균 (차트/레이더/랭크)
│       ├── StackedSection.tsx ← 과목별 일별 누적
│       ├── GapSection.tsx     ← 순공 vs 비공부 시간 분석
│       ├── ReportSection.tsx  ← AI 학습 보고서
│       └── utils.ts           ← 반 평균 조회 헬퍼
│
├── hooks/
│   └── useSelectedStudent.ts  ← 선택 학생 localStorage 동기화
│
├── lib/
│   ├── types.ts               ← 공용 타입 (Flask API 응답과 1:1)
│   ├── storage.ts             ← localStorage 래퍼 (키 정의)
│   ├── format.ts              ← 시간/날짜 포맷
│   ├── plan.ts                ← 공부 계획 시간 계산
│   ├── comment.ts             ← AI 코멘트 생성 (generate_comment 포팅)
│   ├── stats.ts               ← 대시보드 통계 계산 (get_dashboard 포팅)
│   ├── dummy.ts               ← 더미 데이터 생성 (generate_dummy.py 포팅)
│   ├── random.ts              ← 시드 난수 (더미 재현용)
│   └── api/                   ← ★ 데이터 접근 계층 (서버 전환 지점)
│       ├── types.ts           ← StudyApi 인터페이스 (Flask 엔드포인트와 1:1)
│       ├── localApi.ts        ← localStorage 구현
│       └── index.ts           ← 구현 선택 (localApi ↔ serverApi)
│
├── data/                      ← JSON 시드 데이터
│   ├── subjects.json          ← 기본 과목 8개
│   └── dummy-students.json    ← 더미 학생 명단 + 성향 프로필
│
└── styles/                    ← 페이지별 스타일
    ├── timer.css
    ├── dashboard.css
    └── data.css
```

## 🔌 나중에 서버로 전환하는 방법

모든 화면은 `lib/api/index.ts`가 내보내는 `api` 객체만 사용합니다.
`StudyApi` 인터페이스(`lib/api/types.ts`)는 기존 Flask 엔드포인트와 1:1 대응이므로:

1. `lib/api/serverApi.ts`를 만들어 각 메서드를 `fetch('/api/...')`로 구현
   ```ts
   // 예시
   async getSubjects() {
     return (await fetch('/api/subjects')).json();
   }
   ```
2. `lib/api/index.ts`에서 한 줄만 교체
   ```ts
   export const api: StudyApi = serverApi; // localApi → serverApi
   ```
3. 서버 응답 스키마는 `lib/types.ts`의 타입을 그대로 사용
   (대시보드 통계 계산 `lib/stats.ts`는 서버 쪽으로 이동)

`/data` 페이지의 **JSON 내보내기**로 받은 파일이 그대로 서버 DB 마이그레이션용 시드가 됩니다
(`{ subjects, students, sessions }` 구조).

## 데이터 저장 위치

| localStorage 키 | 내용 |
|------|------|
| `study-timer:subjects` | 과목 목록 (이름/목표시간/색상/완료상태/순서) |
| `study-timer:students` | 학생 목록 |
| `study-timer:sessions` | 모든 공부 세션 기록 |
| `study-timer:student_id` | 현재 선택된 학생 |
| `study-timer:seeded` | 초기 시드 완료 플래그 |
