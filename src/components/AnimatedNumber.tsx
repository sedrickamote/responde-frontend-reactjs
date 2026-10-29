import { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';

export interface AnimatedNumberProps {
  /** Target number to animate to */
  value: number;
  /** Duration of the count-up animation in seconds (default: 3.5s for butter-smooth pacing) */
  duration?: number;
  /** Delay in seconds before counting begins (default: 0.2s to clear initial card mount) */
  delay?: number;
  /** Optional CSS classes for the container span */
  className?: string;
  /** Custom formatter function (defaults to locale integer formatting) */
  formatter?: (val: number) => string;
}

/**
 * AnimatedNumber
 * 
 * Smoothly counts from 0 (or previous value) to the target maximum number.
 * - 3.5s cinematic pacing with [0.25, 1, 0.5, 1] easing to prevent stutter.
 * - Initial 0.2s delay ensures main thread is idle after WebGL map & SVG chart mounting.
 * - Throttles DOM updates only when the formatted integer value changes.
 * - Respects prefers-reduced-motion for accessibility.
 */
export default function AnimatedNumber({
  value,
  duration = 3.5,
  delay = 0.2,
  className = '',
  formatter = (v) => Math.round(v).toLocaleString(),
}: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(0);

  useEffect(() => {
    // If user prefers reduced motion, snap immediately to the target value
    if (prefersReducedMotion) {
      if (ref.current) {
        ref.current.textContent = formatter(value);
      }
      prevValueRef.current = value;
      return;
    }

    const start = prevValueRef.current;
    const end = value;
    prevValueRef.current = value;

    let lastRendered = '';

    const controls = animate(start, end, {
      duration,
      delay,
      // Butter-smooth cubic curve: steady onset, continuous roll, graceful glide into target
      ease: [0.25, 1, 0.5, 1],
      onUpdate(latest) {
        if (ref.current) {
          const formatted = formatter(latest);
          // Only mutate the DOM text node when the integer actually changes
          if (formatted !== lastRendered) {
            lastRendered = formatted;
            ref.current.textContent = formatted;
          }
        }
      },
    });

    return () => controls.stop();
  }, [value, duration, delay, prefersReducedMotion, formatter]);

  return (
    <span ref={ref} className={className}>
      {prefersReducedMotion ? formatter(value) : formatter(prevValueRef.current)}
    </span>
  );
}
