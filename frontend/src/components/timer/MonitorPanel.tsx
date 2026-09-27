'use client';

// 웹캠 모니터링 패널 (원본 index.html 모니터링 로직 포팅)
// - 웹캠 프레임 차분으로 움직임/자리비움 감지 → 자동 태깅
// - 수동 딴짓 태그 버튼 (핸드폰/멍때림/자리비움/졸음)
// - 태그가 켜져 있는 동안 1초마다 해당 딴짓 시간 누적

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { fmtShort } from '@/lib/format';
import type { Distractions } from '@/lib/types';

const MOTION_TH = 15;
const PRESENCE_TH = 5;
const NO_MOTION_LIM = 100;
const NO_PRESENCE_LIM = 50;

type Tag = keyof Distractions;

const TAG_META: { tag: Tag; icon: string; label: string; color: string }[] = [
  { tag: 'phone', icon: '📱', label: '핸드폰', color: '#e91e63' },
  { tag: 'spacing', icon: '😶', label: '멍때림', color: '#ff9800' },
  { tag: 'away', icon: '🚶', label: '자리 비움', color: '#2196f3' },
  { tag: 'drowsy', icon: '😴', label: '졸음/기타', color: '#9c27b0' },
];

const TAG_NAMES: Record<Tag, string> = {
  phone: '📱 핸드폰',
  spacing: '😶 멍때림',
  away: '🚶 자리비움',
  drowsy: '😴 졸음/기타',
};

const ZERO: Distractions = { phone: 0, spacing: 0, away: 0, drowsy: 0 };

export interface MonitorHandle {
  getDistractions: () => Distractions;
}

interface Props {
  active: boolean;
  running: boolean;
}

const MonitorPanel = forwardRef<MonitorHandle, Props>(function MonitorPanel({ active, running }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionFillRef = useRef<HTMLDivElement>(null);
  const motionValRef = useRef<HTMLSpanElement>(null);

  const [distractions, setDistractions] = useState<Distractions>(ZERO);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);
  const [badge, setBadge] = useState<{ text: string; cls: string }>({ text: '집중 중', cls: 'ok' });
  const [logs, setLogs] = useState<{ time: string; msg: string }[]>([]);

  // rAF 루프에서 최신 값을 읽기 위한 미러 ref
  const distractionsRef = useRef<Distractions>(ZERO);
  const currentTagRef = useRef<Tag | null>(null);
  const animIdRef = useRef<number | null>(null);
  const prevFrameRef = useRef<Uint8Array | null>(null);
  const refFrameRef = useRef<Uint8Array | null>(null);
  const frameCountRef = useRef(0);
  const noMotionRef = useRef(0);
  const noPresenceRef = useRef(0);

  useImperativeHandle(ref, () => ({ getDistractions: () => distractionsRef.current }), []);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((prev) => [{ time, msg }, ...prev].slice(0, 15));
  }, []);

  const setTag = useCallback(
    (tag: Tag | null) => {
      currentTagRef.current = tag;
      setCurrentTag(tag);
    },
    [],
  );

  const tagDistraction = useCallback(
    (tag: Tag) => {
      const cur = currentTagRef.current;
      if (cur === tag) {
        setTag(null);
        setBadge({ text: '집중 중', cls: 'ok' });
        addLog(`${TAG_NAMES[tag]} 종료`);
        return;
      }
      if (cur) addLog(`${TAG_NAMES[cur]} 종료`);
      setTag(tag);
      addLog(`${TAG_NAMES[tag]} 시작`);
    },
    [addLog, setTag],
  );

  // ── 딴짓 시간 누적 (타이머 실행 중 + 태그 활성 시 1초마다) ──
  useEffect(() => {
    if (!active || !running) return;
    const t = setInterval(() => {
      const tag = currentTagRef.current;
      if (!tag) return;
      setDistractions((prev) => {
        const next = { ...prev, [tag]: prev[tag] + 1 };
        distractionsRef.current = next;
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [active, running]);

  // ── 웹캠 시작/정지 ──
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // 시작 시 상태 초기화 (원본 initWebcam)
    prevFrameRef.current = null;
    refFrameRef.current = null;
    frameCountRef.current = 0;
    noMotionRef.current = 0;
    noPresenceRef.current = 0;
    distractionsRef.current = ZERO;
    setDistractions(ZERO);
    setTag(null);
    setBadge({ text: '집중 중', cls: 'ok' });
    setLogs([]);

    const drawOverlay = (w: number, h: number) => {
      const tagged = currentTagRef.current !== null;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = tagged ? 'rgba(244,67,54,0.6)' : 'rgba(76,175,80,0.4)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      const cx = w / 2;
      const headY = h * 0.22;
      const headR = h * 0.12;
      ctx.beginPath();
      ctx.ellipse(cx, headY, headR * 0.85, headR, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.25, h * 0.55);
      ctx.quadraticCurveTo(cx - w * 0.15, h * 0.32, cx, h * 0.35);
      ctx.quadraticCurveTo(cx + w * 0.15, h * 0.32, cx + w * 0.25, h * 0.55);
      ctx.stroke();
      ctx.setLineDash([]);
      if (tagged) {
        ctx.fillStyle = 'rgba(244,67,54,0.12)';
        ctx.fillRect(0, 0, w, h);
      }
    };

    const processFrame = () => {
      if (cancelled) return;
      if (!video || video.paused || video.ended) {
        animIdRef.current = requestAnimationFrame(processFrame);
        return;
      }
      const w = canvas.width;
      const h = canvas.height;
      ctx.drawImage(video, 0, 0, w, h);
      const frame = ctx.getImageData(0, 0, w, h);
      frameCountRef.current++;
      if (frameCountRef.current === 30) {
        refFrameRef.current = new Uint8Array(frame.data);
        addLog('기준 프레임 저장');
      }

      const prev = prevFrameRef.current;
      if (prev && frameCountRef.current > 10) {
        let diff = 0;
        let presDiff = 0;
        const d = frame.data;
        const step = 8;
        const total = d.length / 4 / step;
        for (let i = 0; i < d.length; i += step * 4) {
          const avg =
            (Math.abs(d[i] - prev[i]) + Math.abs(d[i + 1] - prev[i + 1]) + Math.abs(d[i + 2] - prev[i + 2])) / 3;
          if (avg > MOTION_TH) diff++;
        }
        const refFrame = refFrameRef.current;
        if (refFrame) {
          for (let i = 0; i < d.length; i += step * 4) {
            const avg =
              (Math.abs(d[i] - refFrame[i]) +
                Math.abs(d[i + 1] - refFrame[i + 1]) +
                Math.abs(d[i + 2] - refFrame[i + 2])) / 3;
            if (avg > 25) presDiff++;
          }
        }
        const motionLevel = (diff / total) * 100;
        const presLevel = refFrame ? (presDiff / total) * 100 : 50;
        if (motionFillRef.current) motionFillRef.current.style.width = `${Math.min(motionLevel * 5, 100)}%`;
        if (motionValRef.current) motionValRef.current.textContent = `${motionLevel.toFixed(1)}%`;

        if (presLevel < PRESENCE_TH && refFrame) {
          noPresenceRef.current++;
          if (noPresenceRef.current > NO_PRESENCE_LIM && !currentTagRef.current) {
            tagDistraction('away');
            setBadge({ text: '자리 비움 감지', cls: 'away' });
          }
        } else {
          if (currentTagRef.current === 'away' && noPresenceRef.current > NO_PRESENCE_LIM) tagDistraction('away');
          noPresenceRef.current = 0;
          if (motionLevel < 0.3) {
            noMotionRef.current++;
            if (noMotionRef.current > NO_MOTION_LIM && !currentTagRef.current) {
              tagDistraction('spacing');
              setBadge({ text: '멍때림 감지', cls: 'warn' });
            }
          } else {
            if (currentTagRef.current === 'spacing' && noMotionRef.current > NO_MOTION_LIM) tagDistraction('spacing');
            noMotionRef.current = 0;
            if (!currentTagRef.current) setBadge((b) => (b.cls === 'ok' ? b : { text: '집중 중', cls: 'ok' }));
          }
        }
        drawOverlay(w, h);
      }
      prevFrameRef.current = new Uint8Array(frame.data);
      animIdRef.current = requestAnimationFrame(processFrame);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        const onLoad = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          addLog('웹캠 연결 완료');
          animIdRef.current = requestAnimationFrame(processFrame);
          video.removeEventListener('loadeddata', onLoad);
        };
        video.addEventListener('loadeddata', onLoad);
      })
      .catch((e: Error) => {
        addLog(`웹캠 연결 실패: ${e.message}`);
        setBadge({ text: '웹캠 없음', cls: 'away' });
      });

    return () => {
      cancelled = true;
      if (animIdRef.current) {
        cancelAnimationFrame(animIdRef.current);
        animIdRef.current = null;
      }
      const stream = video.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
      prevFrameRef.current = null;
      refFrameRef.current = null;
    };
  }, [active, addLog, setTag, tagDistraction]);

  if (!active) return null;

  const total = distractions.phone + distractions.spacing + distractions.away + distractions.drowsy;
  const max = Math.max(total, 60);

  return (
    <div className="card monitor-panel">
      <div className="card-header">
        <h2>웹캠 모니터링</h2>
      </div>
      <div className="monitor-grid">
        <div>
          <div className="webcam-box">
            <video ref={videoRef} autoPlay playsInline muted />
            <canvas ref={canvasRef} />
            <div className={`webcam-badge ${badge.cls}`}>{badge.text}</div>
          </div>
          <div className="motion-meter">
            <span>움직임</span>
            <div className="motion-track">
              <div className="fill" ref={motionFillRef} style={{ width: '0%' }} />
            </div>
            <span ref={motionValRef}>0%</span>
          </div>
        </div>
        <div className="distraction-panel">
          <div className="distraction-total-box">
            <div className="big">{fmtShort(total)}</div>
            <div className="lbl">총 딴짓 시간</div>
          </div>
          {TAG_META.map((t) => (
            <div className="dist-bar-row" key={t.tag}>
              <div className="dist-bar-label">
                {t.icon} {t.label}
              </div>
              <div className="dist-bar-track">
                <div
                  className="dist-bar-fill"
                  style={{
                    width: `${total > 0 ? Math.max((distractions[t.tag] / max) * 100, 0) : 0}%`,
                    background: t.color,
                  }}
                />
              </div>
              <div className="dist-bar-val">{fmtShort(distractions[t.tag])}</div>
            </div>
          ))}
          <div className="tag-buttons">
            {TAG_META.map((t) => (
              <button
                key={t.tag}
                className={`tag-btn${currentTag === t.tag ? ' active' : ''}`}
                onClick={() => tagDistraction(t.tag)}
              >
                <span className="icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="monitor-log">
        {logs.map((l, i) => (
          <div className="entry" key={`${l.time}-${i}`}>
            <span className="t">{l.time}</span>
            {l.msg}
          </div>
        ))}
      </div>
    </div>
  );
});

export default MonitorPanel;
