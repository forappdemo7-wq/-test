import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Camera, Film, Image as ImageIcon, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const FloatingActionButton: React.FC = () => {
  const { setIsCreateOpen, activeTab, setActiveTab } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Only show on feed or explore on mobile/tablet or when scrolling
  if (activeTab === 'messages' || activeTab === 'profile') return null;

  const actions = [
    {
      id: 'post',
      label: 'New Post',
      icon: <ImageIcon size={18} className="text-white" />,
      color: 'bg-gradient-to-tr from-pink-500 to-rose-500',
      action: () => {
        setIsCreateOpen(true);
        setIsOpen(false);
      },
    },
    {
      id: 'reel',
      label: 'New Reel',
      icon: <Film size={18} className="text-white" />,
      color: 'bg-gradient-to-tr from-purple-600 to-indigo-600',
      action: () => {
        setIsCreateOpen(true);
        setIsOpen(false);
      },
    },
    {
      id: 'story',
      label: 'Add Story',
      icon: <Camera size={18} className="text-white" />,
      color: 'bg-gradient-to-tr from-amber-500 to-orange-500',
      action: () => {
        setIsCreateOpen(true);
        setIsOpen(false);
      },
    },
  ];

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 z-30 flex flex-col items-end gap-3 pointer-events-none select-none">
      {/* Expanded Speed Dial Action Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="flex flex-col items-end gap-2.5 pointer-events-auto"
          >
            {actions.map((act, index) => (
              <motion.button
                key={act.id}
                initial={{ opacity: 0, scale: 0.5, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.5, x: 20 }}
                transition={{
                  type: 'spring',
                  stiffness: 400,
                  damping: 20,
                  delay: index * 0.04,
                }}
                onClick={act.action}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white dark:bg-neutral-900 shadow-soft-lg border border-neutral-200/80 dark:border-neutral-800 text-neutral-800 dark:text-neutral-100 text-xs font-bold hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              >
                <span>{act.label}</span>
                <div className={`w-8 h-8 rounded-full ${act.color} flex items-center justify-center shadow-soft-xs`}>
                  {act.icon}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setIsOpen((prev) => !prev)}
        className="pointer-events-auto relative w-13 h-13 rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-500 text-white flex items-center justify-center shadow-glow-pink cursor-pointer"
        title="Create (Post, Story, Reel)"
      >
        {/* Pulsing ring animation */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.2,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 rounded-full bg-pink-500 -z-10"
        />

        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <Plus size={26} className="stroke-[2.5px]" />
        </motion.div>
      </motion.button>
    </div>
  );
};
