import React, { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Sparkles, ArrowDown } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  isRefreshing?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  isRefreshing: externalRefreshing = false,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(externalRefreshing);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const pullDistance = useMotionValue(0);

  const THRESHOLD = 70;
  const MAX_PULL = 110;

  // Sync external refreshing state
  useEffect(() => {
    setIsRefreshing(externalRefreshing);
    if (!externalRefreshing) {
      animate(pullDistance, 0, { type: 'spring', stiffness: 350, damping: 25 });
    }
  }, [externalRefreshing, pullDistance]);

  // Derived transforms for spring visuals
  const spinnerScale = useTransform(pullDistance, [0, 20, THRESHOLD], [0.2, 0.7, 1]);
  const spinnerOpacity = useTransform(pullDistance, [0, 15, THRESHOLD], [0, 0.5, 1]);
  const spinnerRotate = useTransform(pullDistance, [0, MAX_PULL], [0, 360]);
  const arrowRotate = useTransform(pullDistance, [THRESHOLD - 20, THRESHOLD], [0, 180]);

  const getScrollTop = (): number => {
    return (
      window.scrollY ||
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      containerRef.current?.scrollTop ||
      0
    );
  };

  const handleStart = useCallback(
    (clientY: number) => {
      if (isRefreshing) return;
      const scrollTop = getScrollTop();
      if (scrollTop <= 5) {
        startYRef.current = clientY;
        isDraggingRef.current = true;
      } else {
        isDraggingRef.current = false;
      }
    },
    [isRefreshing]
  );

  const handleMove = useCallback(
    (clientY: number, e?: TouchEvent | MouseEvent) => {
      if (!isDraggingRef.current || isRefreshing) return;
      const deltaY = clientY - startYRef.current;

      if (deltaY > 0 && getScrollTop() <= 5) {
        // Prevent default native bounce/scroll when pulling down at the top
        if (e && e.cancelable) {
          e.preventDefault();
        }

        // Elastic resistance formula for natural iOS/Android feel
        const dampingFactor = 0.42;
        const calculatedPull = Math.min(MAX_PULL, deltaY * dampingFactor);
        pullDistance.set(calculatedPull);

        // Haptic feedback when crossing the trigger threshold
        if (calculatedPull >= THRESHOLD && pullDistance.get() < THRESHOLD) {
          if ('vibrate' in navigator) {
            try {
              navigator.vibrate(10);
            } catch {}
          }
        }
      } else if (deltaY < 0) {
        // User scrolling up - abort pull-to-refresh
        isDraggingRef.current = false;
        pullDistance.set(0);
      }
    },
    [isRefreshing, pullDistance]
  );

  const handleEnd = useCallback(async () => {
    if (!isDraggingRef.current || isRefreshing) return;
    isDraggingRef.current = false;

    const currentPull = pullDistance.get();
    if (currentPull >= THRESHOLD) {
      // Snap to refreshing height and trigger callback
      setIsRefreshing(true);
      animate(pullDistance, 55, { type: 'spring', stiffness: 350, damping: 25 });
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        animate(pullDistance, 0, { type: 'spring', stiffness: 400, damping: 30 });
      }
    } else {
      // Snap back to 0 if threshold not reached
      animate(pullDistance, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  }, [isRefreshing, onRefresh, pullDistance]);

  // Attach native non-passive touch listeners to container for reliable preventDefault on mobile pull
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleStart(e.touches[0].clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleMove(e.touches[0].clientY, e);
      }
    };

    const onTouchEnd = () => {
      handleEnd();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  // Window-level mouse listener fallback for desktop drag gestures
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleMove(e.clientY, e);
      }
    };

    const onMouseUp = () => {
      if (isDraggingRef.current) {
        handleEnd();
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleMove, handleEnd]);

  return (
    <div
      ref={containerRef}
      onMouseDown={(e) => {
        if (e.button === 0) handleStart(e.clientY);
      }}
      className="relative w-full overflow-x-hidden min-h-full touch-pan-y"
    >
      {/* Pull Indicator / Instagram Gradient Spinner */}
      <motion.div
        style={{
          y: pullDistance,
          scale: spinnerScale,
          opacity: spinnerOpacity,
        }}
        className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center justify-center"
      >
        <div className="w-10 h-10 rounded-full bg-white dark:bg-neutral-900 shadow-soft-lg border border-neutral-200/90 dark:border-neutral-800 flex items-center justify-center p-2">
          {isRefreshing ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
              className="w-5 h-5 rounded-full border-2 border-transparent border-t-pink-500 border-r-purple-500 border-b-amber-500"
            />
          ) : (
            <motion.div
              style={{ rotate: spinnerRotate }}
              className="flex items-center justify-center text-pink-500"
            >
              <Sparkles size={18} className="text-pink-500 fill-pink-500" />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Main Content with Spring Offset */}
      <motion.div
        style={{
          y: pullDistance,
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="w-full"
      >
        {children}
      </motion.div>
    </div>
  );
};
