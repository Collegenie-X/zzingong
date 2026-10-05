'use client';

// 웹캠 모니터링 패널 (원본 index.html 모니터링 로직 포팅)
// - 웹캠 프레임 차분으로 움직임/자리비움 감지 → 자동 태깅
// - 수동 딴짓 태그 버튼 (핸드폰/멍때림/자리비움/졸음)
// - 태그가 켜져 있는 동안 1초마다 해당 딴짓 시간 누적

import {
  type CSSProperties,
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

export type Tag = keyof Distractions;

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

interface Shot {
  id: number;
  time: string;
  tag: Tag;
  url: string;
}

const ZERO: Distractions = { phone: 0, spacing: 0, away: 0, drowsy: 0 };

export interface MonitorHandle {
  getDistractions: () => Distractions;
  /** 켜져 있는 딴짓 태그를 끕니다 (레이스 화면의 "정신 차리기" 버튼) */
  clearTag: () => void;
}

/** 레이스 화면에 넘겨 주는 가짜 공부 현황 */
export interface FakeStatus {
  tag: Tag | null;
  /** 누적 가짜 공부(딴짓) 초 */
  total: number;
  /** 마지막 딴짓 이후 연속 집중 초 */
  combo: number;
}

interface Props {
  active: boolean;
  running: boolean;
  onStatus?: (s: FakeStatus) => void;
}

const MonitorPanel = forwardRef<MonitorHandle, Props>(function MonitorPanel({ active, running, onStatus }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const motionFillRef = useRef<HTMLDivElement>(null);
  const motionValRef = useRef<HTMLSpanElement>(null);

  const [distractions, setDistractions] = useState<Distractions>(ZERO);
  const [currentTag, setCurrentTag] = useState<Tag | null>(null);
  const [combo, setCombo] = useState(0);
  const [badge, setBadge] = useState<{ text: string; cls: string }>({ text: '집중 중', cls: 'ok' });
  const [logs, setLogs] = useState<{ time: string; msg: string }[]>([]);
  /** 딴짓이 시작된 순간의 스냅샷 (이 브라우저 메모리에만 보관, 업로드/저장 없음) */
  const [shots, setShots] = useState<Shot[]>([]);
  const [viewShot, setViewShot] = useState<Shot | null>(null);
  /** 이번 딴짓이 이어진 초 (태그가 바뀌면 0부터) */
  const [episode, setEpisode] = useState(0);
  /** 딴짓을 끝냈을 때 잠깐 보여 주는 결과 토스트 */
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const episodeRef = useRef(0);
  const shotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const shotIdRef = useRef(0);

  // rAF 루프에서 최신 값을 읽기 위한 미러 ref
  const distractionsRef = useRef<Distractions>(ZERO);
  const currentTagRef = useRef<Tag | null>(null);
  const animIdRef = useRef<number | null>(null);
  const prevFrameRef = useRef<Uint8Array | null>(null);
  const refFrameRef = useRef<Uint8Array | null>(null);
  const frameCountRef = useRef(0);
  const noMotionRef = useRef(0);
  const noPresenceRef = useRef(0);


  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLogs((prev) => [{ time, msg }, ...prev].slice(0, 15));
  }, []);

  // ── 딴짓 순간 스냅샷 ──
  // 지금의 내 모습을 보여 주는 게 목적이라 작게(240px) 저장하고 최근 12장만 남깁니다.
  const captureShot = useCallback((tag: Tag) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = (shotCanvasRef.current ??= document.createElement('canvas'));
    const w = 240;
    const h = Math.round((video.videoHeight / video.videoWidth) * w);
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // 화면에 보이는 것과 같도록 좌우 반전해서 담습니다
    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
    let url: string;
    try {
      url = canvas.toDataURL('image/jpeg', 0.6);
    } catch {
      return; // 웹캠 미연결 등
    }
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    setShots((prev) => [{ id: shotIdRef.current++, time, tag, url }, ...prev].slice(0, 12));
  }, []);

  const setTag = useCallback(
    (tag: Tag | null) => {
      currentTagRef.current = tag;
      setCurrentTag(tag);
      episodeRef.current = 0;
      setEpisode(0);
    },
    [],
  );

  const tagDistraction = useCallback(
    (tag: Tag) => {
      const cur = currentTagRef.current;
      if (cur === tag) {
        setToast({ id: Date.now(), text: `✅ 다시 찐공 모드! ${TAG_NAMES[tag]} ${fmtShort(episodeRef.current)} 기록됨` });
        setTag(null);
        setBadge({ text: '집중 중', cls: 'ok' });
        addLog(`${TAG_NAMES[tag]} 종료`);
        return;
      }
      if (cur) addLog(`${TAG_NAMES[cur]} 종료`);
      setTag(tag);
      setCombo(0);
      setToast(null);
      addLog(`${TAG_NAMES[tag]} 시작`);
      captureShot(tag);
      // 휴대폰에서는 짧게 진동해 상태가 바뀐 걸 손끝으로도 알려 줍니다
      navigator.vibrate?.(80);
    },
    [addLog, captureShot, setTag],
  );

  useImperativeHandle(
    ref,
    () => ({
      getDistractions: () => distractionsRef.current,
      clearTag: () => {
        const cur = currentTagRef.current;
        if (!cur) return;
        tagDistraction(cur);
        setBadge({ text: '집중 중', cls: 'ok' });
      },
    }),
    [tagDistraction],
  );

  // ── 레이스 화면에 현황 전달 ──
  const total = distractions.phone + distractions.spacing + distractions.away + distractions.drowsy;
  useEffect(() => {
    onStatus?.({ tag: currentTag, total, combo });
  }, [onStatus, currentTag, total, combo]);

  // ── 딴짓 시간 누적 (타이머 실행 중 + 태그 활성 시 1초마다) ──
  useEffect(() => {
    if (!active || !running) return;
    const t = setInterval(() => {
      const tag = currentTagRef.current;
      if (!tag) {
        setCombo((c) => c + 1);
        return;
      }
      episodeRef.current += 1;
      setEpisode(episodeRef.current);
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
    setCombo(0);
    setTag(null);
    setBadge({ text: '집중 중', cls: 'ok' });
    setLogs([]);
    setShots([]);
    setViewShot(null);
    setToast(null);

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

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!active) return null;

  const max = Math.max(total, 60);
  const activeMeta = currentTag ? TAG_META.find((t) => t.tag === currentTag)! : null;
  // 방금 이 딴짓을 시작할 때 찍힌 사진
  const liveShot = currentTag && shots[0]?.tag === currentTag ? shots[0] : null;

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
          <div className={`tag-buttons${currentTag ? ' has-active' : ''}`}>
            {TAG_META.map((t) => {
              const on = currentTag === t.tag;
              return (
                <button
                  key={t.tag}
                  className={`tag-btn${on ? ' active' : ''}`}
                  style={{ '--tag-color': t.color } as CSSProperties}
                  aria-pressed={on}
                  onClick={() => tagDistraction(t.tag)}
                >
                  <span className="icon">{t.icon}</span>
                  <span className="tag-name">{t.label}</span>
                  {on && (
                    <span className="tag-live">
                      <i />
                      {fmtShort(episode)}
                    </span>
                  )}
                  {on && <span className="tag-hint">눌러서 끝내기</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {shots.length > 0 && (
        <div className="shot-strip">
          <div className="shot-strip-head">
            <span>딴짓 순간 {shots.length}장</span>
            <span className="hint">이 컴퓨터에만 남고, 종료하면 사라집니다</span>
          </div>
          <div className="shot-thumbs">
            {shots.map((sh) => (
              <button
                key={sh.id}
                className="shot-thumb"
                onClick={() => setViewShot(sh)}
                title={`${sh.time} ${TAG_NAMES[sh.tag]}`}
              >
                {/* 사용자의 웹캠에서 만든 data URL 이라 next/image 대신 img 사용 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={sh.url} alt={`${sh.time} ${TAG_NAMES[sh.tag]} 순간`} />
                <span className="shot-tag">{TAG_META.find((t) => t.tag === sh.tag)?.icon}</span>
                <span className="shot-time">{sh.time}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {viewShot && (
        <div className="shot-viewer" role="dialog" aria-label="딴짓 순간 사진" onClick={() => setViewShot(null)}>
          <div className="shot-viewer-card">
            <div className="shot-viewer-head">
              <span>
                {TAG_NAMES[viewShot.tag]} <small>{viewShot.time}</small>
              </span>
              <button className="shot-viewer-close" aria-label="닫기">
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewShot.url} alt={`${viewShot.time} ${TAG_NAMES[viewShot.tag]} 순간 크게 보기`} />
            <p>이 순간의 내 모습, 기억해 두세요.</p>
          </div>
        </div>
      )}

      {/* 딴짓 중: 어디로 스크롤하든 화면 아래에 상태를 고정해서 보여 줍니다 */}
      {activeMeta && (
        <>
          <div className="fake-dock-spacer" aria-hidden />
          <div
            className={`fake-dock${running ? '' : ' paused'}`}
            role="status"
            aria-live="polite"
            style={{ '--tag-color': activeMeta.color } as CSSProperties}
          >
            <div className="fake-dock-thumb">
              {liveShot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={liveShot.url} alt="딴짓 시작 순간" />
              ) : (
                <span>{activeMeta.icon}</span>
              )}
              <i className="rec-dot" />
            </div>
            <div className="fake-dock-info">
              <span className="fake-dock-title">
                {running ? '가짜 공부 기록 중' : '일시정지 · 기록 멈춤'}
              </span>
              <span className="fake-dock-tag">
                {activeMeta.icon} {activeMeta.label}
                <b>{fmtShort(episode)}</b>
              </span>
              <span className="fake-dock-sub">찐공 멈춤 · 오늘 가짜 공부 {fmtShort(total)}</span>
            </div>
            <button className="fake-dock-btn" onClick={() => tagDistraction(activeMeta.tag)}>
              💪<span>정신 차리기</span>
            </button>
          </div>
        </>
      )}

      {toast && (
        <div key={toast.id} className="fake-toast" role="status">
          {toast.text}
        </div>
      )}

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
