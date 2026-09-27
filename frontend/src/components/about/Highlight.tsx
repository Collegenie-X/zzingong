import { Fragment } from 'react';

/**
 * `==단어==` 로 감싼 부분을 하이라이트(<mark>)로 바꿔 줍니다.
 * 소개 페이지 콘텐츠(src/data/about.json)의 모든 문장에 적용됩니다.
 */
export function hl(text: string) {
  return text.split(/(==[^=]+==)/g).map((part, i) =>
    part.length > 4 && part.startsWith('==') && part.endsWith('==') ? (
      <mark key={i}>{part.slice(2, -2)}</mark>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
