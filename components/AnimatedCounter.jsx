'use client';

import React, { useEffect, useState, useRef } from 'react';

/**
 * Easing function: easeOutExpo
 * Fast start, very smooth deceleration into the target number.
 */
function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

/**
 * AnimatedCounter component
 * 
 * Smoothly animates numbers from a previous value to the next value over `duration` ms.
 * Displays formatted Indian numbers and provides visual feedback when the value increases.
 */
export default function AnimatedCounter({
  value = 0,
  duration = 1200,
  className = '',
  showDelta = true,
  prefix = '',
  suffix = '',
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [delta, setDelta] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTargetRef = useRef(value);
  const startValueRef = useRef(value);
  const startTimeRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    const target = Number(value) || 0;
    const start = displayValue;

    if (target === start && !isAnimating) {
      prevTargetRef.current = target;
      return;
    }

    const difference = target - prevTargetRef.current;
    if (difference > 0 && showDelta) {
      setDelta(difference);
      const timer = setTimeout(() => {
        setDelta(null);
      }, duration + 1500);
      return () => clearTimeout(timer);
    }
  }, [value, showDelta, duration]);

  useEffect(() => {
    const target = Number(value) || 0;
    const start = displayValue;

    if (target === start) {
      prevTargetRef.current = target;
      return;
    }

    startValueRef.current = start;
    prevTargetRef.current = target;
    startTimeRef.current = null;
    setIsAnimating(true);

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);

      const current = Math.round(startValueRef.current + (target - startValueRef.current) * easedProgress);
      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(target);
        setIsAnimating(false);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  const formatted = displayValue.toLocaleString('en-IN');

  return (
    <div className="inline-flex items-baseline gap-2 relative">
      <span
        data-testid="animated-counter-value"
        className={`${className} transition-colors duration-300 ${
          isAnimating && delta && delta > 0 ? 'text-emerald-300' : ''
        }`}
      >
        {prefix}
        {formatted}
        {suffix}
      </span>

      {/* Floating Delta Badge when balance increases */}
      {delta !== null && delta > 0 && (
        <span
          data-testid="animated-counter-delta"
          className="inline-flex items-center gap-0.5 px-2 py-0.5 text-xs font-black bg-emerald-400/20 text-[#25D366] border border-[#25D366]/40 rounded-full animate-bounce shadow-sm"
        >
          +{prefix}
          {delta.toLocaleString('en-IN')}
        </span>
      )}
    </div>
  );
}
