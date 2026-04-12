'use client';

import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  precision?: number;
  showSign?: boolean;
}

export function AnimatedNumber({
  value,
  className,
  precision = 0,
  showSign = false,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const delta = endValue - startValue;
    const duration = 650;
    let frame = 0;
    const startedAt = performance.now();

    if (delta === 0) {
      setDisplayValue(endValue);
      return;
    }

    const tick = (now: number) => {
      const t = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayValue(startValue + delta * eased);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        prevValueRef.current = endValue;
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  const factor = 10 ** precision;
  const rounded = Math.round(displayValue * factor) / factor;
  const text = precision > 0
    ? rounded.toFixed(precision).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
    : String(Math.round(rounded));

  return (
    <span className={className}>
      {showSign && rounded > 0 ? '+' : ''}
      {text}
    </span>
  );
}
