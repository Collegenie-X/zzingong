import type { Metadata, Viewport } from 'next';
import Nav from '@/components/Nav';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'ZZINGONG AI — 찐공AI',
    template: '%s | ZZINGONG AI',
  },
  description: '딴짓 빼고 재는 진짜 순공시간. 과목별 공부 시간 측정과 학습 통계 대시보드',
  applicationName: 'ZZINGONG AI',
  appleWebApp: { title: '찐공AI', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  themeColor: '#16213e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
