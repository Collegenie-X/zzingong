// 소개 페이지 (/about) — 스크롤 스토리

import type { Metadata } from 'next';
import AboutStory from '@/components/about/AboutStory';
import '@/styles/about.css';

export const metadata: Metadata = {
  title: '소개',
  description:
    '찐공AI는 웹캠으로 딴짓을 걸러내고 진짜 순공 시간만 기록합니다. 문제부터 사용법, 프라이버시까지 한 번에 살펴보세요.',
};

export default function AboutPage() {
  return <AboutStory />;
}
