import { useRef, useCallback, useEffect } from 'react';

/**
 * ボタン長押しによる数値の連続増減を管理する汎用フック
 */
export function useHoldToAdjust(
  onChangeValue: (delta: number) => void,
  initialDelay = 320,
  repeatInterval = 120
) {
  const repeatRef = useRef<number | null>(null);
  const longPressRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (longPressRef.current !== null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    if (repeatRef.current !== null) {
      window.clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  const startAdjust = useCallback((delta: number) => {
    clearTimers();
    onChangeValue(delta); // 初回の1クリック分
    longPressRef.current = window.setTimeout(() => {
      repeatRef.current = window.setInterval(() => {
        onChangeValue(delta);
      }, repeatInterval);
    }, initialDelay);
  }, [clearTimers, onChangeValue, initialDelay, repeatInterval]);

  return { startAdjust, stopAdjust: clearTimers };
}
