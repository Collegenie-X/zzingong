import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ZZINGONG AI — 찐공AI',
    short_name: '찐공AI',
    description: '딴짓 빼고 재는 진짜 순공시간. 과목별 공부 시간 측정과 학습 통계 대시보드',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f0f23',
    theme_color: '#16213e',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
