import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useSpring, useInView, useReducedMotion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────
// 1. Scroll Progress Bar (Top of page thin gradient line)
// ─────────────────────────────────────────────────────────────
export const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 200,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-400 z-[100] origin-left pointer-events-none"
      style={{ scaleX }}
      aria-hidden="true"
    />
  );
};

// ─────────────────────────────────────────────────────────────
// 2. Reusable ScrollReveal Wrapper (Fade-up on viewport enter)
// ─────────────────────────────────────────────────────────────
interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  duration?: number;
  once?: boolean;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  distance = 24,
  duration = 0.5,
  once = true,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  }[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────
// 3. Count-Up Animated Counter Hook & Component
// ─────────────────────────────────────────────────────────────
interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export const CountUp: React.FC<CountUpProps> = ({
  end,
  duration = 1200,
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [value, setValue] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setValue(end);
      return;
    }

    if (!isInView) return;

    let animationFrameId: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = easedProgress * end;

      setValue(currentVal);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setValue(end);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isInView, end, duration, shouldReduceMotion]);

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────
// 4. Micro-interaction Checkmark Bounce Component
// ─────────────────────────────────────────────────────────────
interface CheckmarkBounceProps {
  children: React.ReactNode;
  delay?: number;
}

export const CheckmarkBounce: React.FC<CheckmarkBounceProps> = ({ children, delay = 0 }) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: [0, 1.25, 1], opacity: 1 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.4,
        delay,
        ease: 'easeOut',
      }}
      className="inline-flex items-center justify-center shrink-0"
    >
      {children}
    </motion.span>
  );
};
