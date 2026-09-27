// ── AI 코멘트 생성 (app.py generate_comment 포팅) ──

interface CommentInput {
  subject: string;
  duration_seconds: number;
  pause_count: number;
}

export function generateComment(
  session: CommentInput,
  allToday: { duration_seconds: number }[],
): string {
  const { duration_seconds: duration, subject, pause_count: pauseCount } = session;
  const totalToday = allToday.reduce((a, s) => a + s.duration_seconds, 0);
  const lines: string[] = [];

  if (duration >= 3600) lines.push(`대단해! ${subject} 1시간 이상 집중했어!`);
  else if (duration >= 1800) lines.push(`${subject} 30분 넘게 공부했어, 잘하고 있어!`);
  else if (duration >= 600) lines.push(`${subject} 10분 공부 완료! 조금씩 늘려보자.`);
  else lines.push(`${subject} 짧게 공부했네. 다음엔 좀 더 해보자!`);

  if (pauseCount === 0) lines.push('한 번도 안 쉬고 집중했네, 멋져!');
  else if (pauseCount <= 2) lines.push(`일시정지 ${pauseCount}번, 적당한 휴식이야.`);
  else lines.push(`일시정지가 ${pauseCount}번이야. 집중이 좀 어려웠나?`);

  if (totalToday >= 7200) lines.push(`오늘 총 ${Math.floor(totalToday / 60)}분 공부! 충분히 노력했어!`);
  else if (totalToday >= 3600) lines.push(`오늘 총 ${Math.floor(totalToday / 60)}분. 좋은 페이스야!`);

  return lines.join(' ');
}
