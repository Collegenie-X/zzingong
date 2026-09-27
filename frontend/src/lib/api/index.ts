// ── API 진입점 ──
// 서버로 전환할 때는 아래 한 줄만 serverApi(fetch 구현)로 바꾸면 됩니다.
//   예) export const api: StudyApi = serverApi;

import { localApi } from './localApi';
import type { StudyApi } from './types';

export const api: StudyApi = localApi;
export type { StudyApi };
