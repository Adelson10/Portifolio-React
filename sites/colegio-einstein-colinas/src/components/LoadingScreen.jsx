import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const LOGO = '/logo.png';

const HIGHLIGHTS = ['35+ anos de história', '1º lugar no município', '3º lugar no estado', 'Parceria UNOPAR desde 2004'];

function LoadingScreen({ ready, onFinish }) {
  const [percent, setPercent] = useState(0);
  const [highlight, setHighlight] = useState(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (ready) return;
    const timer = setInterval(() => {
      setPercent(p => {
        if (p >= 90) return p;
        const step = Math.max(0.6, (90 - p) / 10);
        return Math.min(90, p + step);
      });
    }, 120);
    return () => clearInterval(timer);
  }, [ready]);

  useEffect(() => {
    const timer = setInterval(() => {
      setHighlight(i => (i + 1) % HIGHLIGHTS.length);
    }, 1400);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!ready || finishedRef.current) return;
    finishedRef.current = true;
    setPercent(100);
    const t = setTimeout(() => onFinish?.(), 450);
    return () => clearTimeout(t);
  }, [ready, onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-background"
    >
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-floaty" />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-floaty"
        style={{ animationDelay: '1.5s' }}
      />

      <span className="pointer-events-none absolute bottom-[-3vw] inset-x-0 text-center font-display font-900 text-primary/5 text-[16vw] leading-none select-none whitespace-nowrap">
        EINSTEIN
      </span>

      <div className="relative flex flex-col items-center gap-6 px-6">
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 backdrop-blur-md pl-2 pr-4 py-1.5 text-xs font-600 uppercase tracking-[0.2em] text-primary shadow-[0_8px_24px_-10px_rgba(15,23,42,0.35)]"
        >
          <span className="relative grid place-items-center h-5 w-5 rounded-full bg-accent text-white shrink-0">
            <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-50" />
            <Sparkles className="relative h-3 w-3" />
          </span>
          Excelência desde 1989
        </motion.span>

        <div className="relative grid place-items-center">
          <motion.span
            aria-hidden="true"
            className="absolute -inset-2.5 rounded-full border-2 border-dashed border-accent/40"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <motion.span
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            className="grid place-items-center h-16 w-16 rounded-full bg-white shadow-lg ring-1 ring-primary/10 overflow-hidden"
          >
            <img src={LOGO} alt="Colégio Albert Einstein" className="h-full w-full object-contain p-1.5" />
          </motion.span>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="text-center font-display font-900 leading-[1.02] tracking-tight text-4xl sm:text-5xl text-primary"
        >
          Colégio
          <br />
          <span className="text-accent">Einstein</span>
        </motion.h1>

        <div className="h-5 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={highlight}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="block text-xs font-600 uppercase tracking-[0.15em] text-primary/60"
            >
              {HIGHLIGHTS[highlight]}
            </motion.span>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex w-56 flex-col items-center gap-2"
        >
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          <span className="font-display font-700 text-sm tabular-nums text-primary/70">
            {Math.round(percent)}%
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default LoadingScreen;
