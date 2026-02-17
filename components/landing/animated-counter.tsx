"use client";

import { useEffect } from "react";
import { useRef } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";

type AnimatedCounterProps = {
  value: number;
  suffix?: string;
};

export function AnimatedCounter({ value, suffix = "" }: AnimatedCounterProps) {
  const count = useMotionValue(0);
  const spring = useSpring(count, { duration: 1.2, bounce: 0 });
  const rounded = useTransform(spring, (latest) => Math.floor(latest));
  const ref = useRef<HTMLSpanElement | null>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (isInView) {
      count.set(value);
    }
  }, [count, isInView, value]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </motion.span>
  );
}

