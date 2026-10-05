'use client';

// "AI 학습 리포트" — 코치 로봇이 말로 풀어주는 종합 평가
// 등급 배지 · 요약 타일 · 나 vs 반 평균 추이 · 과목 밸런스 · 칭찬/미션

import { Gem } from '@/components/game/GameIcons';
import { dateLabel, fmtMinKorean } from '@/lib/format';
import type { DashboardData } from '@/lib/types';
import { CoachBot, FocusRing, GradeBadge, KpiIcon, NoteIcon, TrendChart, type BotMood } from './ReportArt';
import type { StandingRow } from './StandingList';
import { peerValue } from './rank';

interface Props {
  data: DashboardData;
  /** 선택한 기간의 날짜들 */
  dates: string[];
  periodLabel: string;
  total: StandingRow;
  subjects: StandingRow[];
}

interface Grade {
  g: string;
  color: string;
  mood: BotMood;
  title: string;
}

function gradeOf(mine: number, topPct: number): Grade {
  if (mine < 1) return { g: '?', color: '#64748b', mood: 'idle', title: '아직 기록이 없어요' };
  if (topPct <= 15) return { g: 'A+', color: '#fbbf24', mood: 'cheer', title: '최고예요! 반에서 손꼽혀요' };
  if (topPct <= 30) return { g: 'A', color: '#22c55e', mood: 'cheer', title: '아주 잘하고 있어요' };
  if (topPct <= 50) return { g: 'B', color: '#38bdf8', mood: 'smile', title: '좋은 흐름이에요' };
  if (topPct <= 70) return { g: 'C', color: '#f59e0b', mood: 'smile', title: '조금만 더 힘내봐요' };
  return { g: 'D', color: '#ef4444', mood: 'worry', title: '괜찮아요, 다시 시작해봐요' };
}

function subjStatus(mine: number, avg: number): { label: string; color: string } {
  if (mine < 1 && avg < 1) return { label: '기록 없음', color: '#64748b' };
  const ratio = avg > 0 ? mine / avg : 2;
  if (ratio >= 1.2) return { label: '강점', color: '#22c55e' };
  if (ratio >= 1) return { label: '좋아요', color: '#22c55e' };
  if (ratio >= 0.7) return { label: '조금 더', color: '#f59e0b' };
  return { label: '보강', color: '#ef4444' };
}

const mean = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : 0);

export default function AiReport({ data, dates, periodLabel, total, subjects }: Props) {
  const me = data.peers.find((p) => p.is_me);
  if (!me) return null;

  const days = dates.length;
  const st = total.st;
  const grade = gradeOf(st.mine, st.topPct);
  const when = days === 1 ? '오늘' : `최근 ${periodLabel}`;
  const diff = Math.round(st.mine - st.avg);
  const perDay = (gap: number) => Math.max(1, Math.ceil(gap / days));

  const pause = dates.reduce((a, d) => a + (me.days[d]?.pause ?? 0), 0);
  const focus = Math.round(peerValue(me, dates, 'focus'));
  const studiedDays = peerValue(me, dates, 'days');
  const focusColor = focus >= 90 ? '#22c55e' : focus >= 70 ? '#f59e0b' : '#ef4444';

  // 추이: 하루만 볼 때도 흐름이 보이게 최소 7일
  const trendDates = data.daily.slice(-Math.max(days, 7)).map((d) => d.date);
  const myTrend = trendDates.map((d) => me.days[d]?.study ?? 0);
  const avgTrend = trendDates.map((d) => mean(data.peers.map((p) => p.days[d]?.study ?? 0)));
  const isUp = mean(myTrend.slice(-3)) >= mean(myTrend.slice(-6, -3));

  const subjMax = Math.max(...subjects.flatMap((s) => [s.st.mine, s.st.avg]), 1);
  const weak = subjects
    .filter((s) => s.st.avg >= 1 && s.st.mine < s.st.avg)
    .sort((a, b) => b.st.avg - b.st.mine - (a.st.avg - a.st.mine))[0];
  const strong = subjects
    .filter((s) => s.st.mine >= 1 && s.st.mine >= s.st.avg * 1.2)
    .sort((a, b) => b.st.mine - b.st.avg - (a.st.mine - a.st.avg))[0];

  // 코치 한마디 (말풍선)
  let speech: React.ReactNode;
  if (st.mine < 1) {
    speech = <>{when} 기록이 아직 없어요. 타이머를 켜고 <b>첫 기록</b>을 남겨볼까요?</>;
  } else if (diff >= 0) {
    speech = <>{when} <b>{fmtMinKorean(st.mine)}</b> 공부했어요. 반 평균보다 <b className="up">{fmtMinKorean(diff)}</b> 더 했네요!</>;
  } else {
    speech = <>{when} <b>{fmtMinKorean(st.mine)}</b> 공부했어요. 하루 <b className="warn">{perDay(-diff)}분</b>만 더 하면 반 평균이에요.</>;
  }

  const praise: React.ReactNode[] = [];
  if (st.mine >= 1 && st.topPct <= 30) praise.push(<>반 <b>{st.rank}등</b>, 상위 {st.topPct}%에 들었어요</>);
  if (st.mine >= 1 && focus >= 90) praise.push(<>집중률 <b>{focus}%</b> — 딴짓 없이 몰입했어요</>);
  if (days >= 7 && studiedDays >= days * 0.7) praise.push(<><b>{studiedDays}일</b>이나 공부했어요. 꾸준함이 최고의 무기!</>);
  if (strong) praise.push(<><b style={{ color: strong.color }}>{strong.label}</b> — 반 평균보다 <b>{fmtMinKorean(strong.st.mine - strong.st.avg)}</b> 더 했어요</>);
  if (st.mine >= 1 && isUp && praise.length < 3) praise.push(<>최근 공부량이 <b>늘고 있어요</b></>);
  if (!praise.length) praise.push(<>리포트를 확인한 것부터가 좋은 시작이에요</>);

  const mission: React.ReactNode[] = [];
  if (weak) mission.push(<><b style={{ color: weak.color }}>{weak.label}</b> 하루 <b>{perDay(weak.st.avg - weak.st.mine)}분</b> 더 해서 반 평균 따라잡기</>);
  if (st.mine >= 1 && focus < 70) mission.push(<><b>25분 집중 + 5분 휴식</b>으로 집중률 올리기</>);
  if (!isUp || st.mine < 1) mission.push(<>매일 <b>같은 시간</b>에 타이머 켜기</>);
  if (st.toNext !== null && st.mine >= 1 && mission.length < 3) mission.push(<>하루 <b>{perDay(st.toNext)}분</b> 더 해서 <b>{st.rank - 1}등</b> 도전하기</>);
  if (!mission.length) mission.push(<>지금 페이스 <b>그대로 유지</b>하기</>);

  return (
    <div className="dash-card ai-report" style={{ '--gc': grade.color } as React.CSSProperties}>
      <div className="card-head">
        <span>AI 학습 리포트</span>
        <span className="rp-period">{when} · 반 {st.size}명 기준</span>
      </div>

      {/* 코치 로봇 + 말풍선 + 등급 배지 */}
      <div className="rp-hero">
        <CoachBot mood={grade.mood} size={68} />
        <div className="rp-bubble">
          <div className="rp-bubble-title">{grade.title}</div>
          <div className="rp-bubble-text">{speech}</div>
        </div>
        <div className="rp-grade">
          <GradeBadge grade={grade.g} color={grade.color} size={52} />
          {st.mine >= 1 && <span>{st.size}명 중 {st.rank}등</span>}
        </div>
      </div>

      {/* 요약 타일 */}
      <div className="rp-kpis">
        <div className="rp-kpi">
          <KpiIcon kind="book" />
          <b>{fmtMinKorean(st.mine)}</b>
          <span>순공 시간</span>
        </div>
        <div className="rp-kpi">
          <FocusRing pct={focus} color={focusColor} />
          <b style={{ color: st.mine >= 1 ? focusColor : undefined }}>{st.mine >= 1 ? `${focus}%` : '–'}</b>
          <span>집중률</span>
        </div>
        <div className="rp-kpi">
          <KpiIcon kind="calendar" />
          <b>{studiedDays}<small>/{days}일</small></b>
          <span>공부한 날</span>
        </div>
        <div className="rp-kpi">
          <KpiIcon kind="cup" />
          <b>{fmtMinKorean(pause)}</b>
          <span>쉬는 시간</span>
        </div>
      </div>

      {/* 나 vs 반 평균 추이 */}
      <div className="rp-sec">
        <div className="rp-sec-head">
          <span>공부량 흐름 <em className={isUp ? 'up' : 'dn'}>{isUp ? '▲ 오르는 중' : '▼ 줄어드는 중'}</em></span>
          <span className="card-legend"><i className="lg-me" />나<i className="lg-avg" />반 평균</span>
        </div>
        <TrendChart mine={myTrend} avg={avgTrend} labels={trendDates.map(dateLabel)} />
      </div>

      {/* 과목 밸런스 */}
      {subjects.length > 0 && (
        <div className="rp-sec">
          <div className="rp-sec-head">
            <span>과목 밸런스</span>
            <span className="card-legend"><i className="lg-avg" />반 평균</span>
          </div>
          {subjects.map((s) => {
            const status = subjStatus(s.st.mine, s.st.avg);
            return (
              <div className="rp-subj" key={s.key} title={`${s.label}: 나 ${fmtMinKorean(s.st.mine)} · 반 평균 ${fmtMinKorean(s.st.avg)}`}>
                <div className="st-label">
                  <Gem color={s.color ?? '#64748b'} on={s.st.mine >= 1} size={14} />
                  <span style={{ color: s.color }}>{s.label}</span>
                </div>
                <div className="rp-bar">
                  <div className="rp-bar-fill" style={{ width: `${(s.st.mine / subjMax) * 100}%`, background: s.color }} />
                  <i className="rp-bar-avg" style={{ left: `${(s.st.avg / subjMax) * 100}%` }} />
                </div>
                <span className="rp-subj-val">{fmtMinKorean(s.st.mine)}</span>
                <span className="rp-chip" style={{ color: status.color, background: `${status.color}22` }}>{status.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 칭찬 스티커 / 다음 미션 */}
      <div className="rp-notes">
        <div className="rp-note praise">
          <div className="rp-note-head"><NoteIcon kind="praise" />칭찬 스티커</div>
          <ul>{praise.slice(0, 3).map((p, i) => <li key={i}>{p}</li>)}</ul>
        </div>
        <div className="rp-note mission">
          <div className="rp-note-head"><NoteIcon kind="mission" />다음 미션</div>
          <ul>{mission.slice(0, 3).map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
