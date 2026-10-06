'use client';

// 클릭해서 여는 작은 팝업 상태
// - 같은 대상을 다시 누르면 닫힘, 다른 대상을 누르면 그 자리로 이동
// - 바깥 클릭 · Esc 로 닫힘
// - 닫을 때 짧은 퇴장 애니메이션을 위해 closing 단계를 거침

import { useCallback, useEffect, useRef, useState } from 'react';

const CLOSE_MS = 140;

export function usePopover<T>() {
  const [value, setValue] = useState<T | null>(null);
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = useCallback(() => {
    if (timer.current) return;
    setClosing(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setClosing(false);
      setValue(null);
    }, CLOSE_MS);
  }, []);

  const open = useCallback((v: T) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setClosing(false);
    setValue(v);
  }, []);

  const toggle = useCallback(
    (v: T) => {
      if (value === v && !closing) close();
      else open(v);
    },
    [value, closing, close, open],
  );

  useEffect(() => {
    if (value === null) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [value, close]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { value, closing, open, close, toggle, ref };
}
