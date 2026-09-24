import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';

interface DoubleTapHeartProps {
  show: boolean;
}

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  duration: number;
}

export const DoubleTapHeart: React.FC<DoubleTapHeartProps> = ({ show }) => {
  // Generate orbital burst particles
  const particles: Particle[] = useMemo(() => {
    const count = 10;
    return Array.from({ length: count }, (_, i) => {
      const angle = (i * (360 / count) + (Math.random() * 20 - 10)) * (Math.PI / 180);
      return {
        id: i,
        angle,
        distance: 70 + Math.random() * 50,
        size: 14 + Math.random() * 12,
        delay: Math.random() * 0.05,
        duration: 0.5 + Math.random() * 0.2,
      };
    });
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          {/* Radial Light Glow Flash */}
          <motion.div
            initial={{ scale: 0.2, opacity: 0 }}
            animate={{ scale: [0.2, 1.8, 2.2], opacity: [0, 0.45, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 blur-2xl"
          />

          {/* Mini Bursting Particle Hearts */}
          {particles.map((p) => {
            const targetX = Math.cos(p.angle) * p.distance;
            const targetY = Math.sin(p.angle) * p.distance;
            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: targetX,
                  y: targetY,
                  scale: [0, 1.2, 0.8, 0],
                  opacity: [0, 1, 0.9, 0],
                  rotate: [0, (p.angle * 180) / Math.PI + 45],
                }}
                transition={{
                  duration: p.duration,
                  delay: p.delay,
                  ease: [0.175, 0.885, 0.32, 1.275],
                }}
                className="absolute"
              >
                <Heart
                  size={p.size}
                  className="text-pink-400 fill-pink-500 drop-shadow-[0_2px_8px_rgba(244,63,94,0.6)]"
                />
              </motion.div>
            );
          })}

          {/* Main Giant Heart Explosion with Spring Bounce & Tilt */}
          <motion.div
            initial={{ scale: 0, rotate: -15, opacity: 0 }}
            animate={{
              scale: [0, 1.35, 0.95, 1.05, 1],
              rotate: [-15, 8, -4, 0],
              opacity: [0, 1, 1, 1, 0.95],
            }}
            exit={{
              scale: 1.5,
              opacity: 0,
              y: -20,
              transition: { duration: 0.25, ease: 'easeIn' },
            }}
            transition={{
              duration: 0.65,
              ease: [0.175, 0.885, 0.32, 1.275],
            }}
            className="relative"
          >
            <Heart
              size={110}
              className="text-white fill-white drop-shadow-[0_12px_28px_rgba(225,48,108,0.75)] filter brightness-105"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
