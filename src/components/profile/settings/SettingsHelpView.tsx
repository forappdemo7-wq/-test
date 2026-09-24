import React, { useState } from 'react';
import { HelpCircle, ShieldCheck, AlertCircle, ChevronDown, Send, CheckCircle2 } from 'lucide-react';

export const SettingsHelpView: React.FC = () => {
  const [activeAccordion, setActiveAccordion] = useState<number | null>(null);
  const [reportText, setReportText] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const faqs = [
    {
      q: 'How do I change my profile photo or bio?',
      a: 'Go to your Profile tab and tap "Edit profile". You can update your name, username, bio, website link, and avatar.',
    },
    {
      q: 'How does private account protection work?',
      a: 'When your account is private, only people you approve can see your photos, videos, and stories. Your existing followers will continue to have access.',
    },
    {
      q: 'How do I create and share Reels or Stories?',
      a: 'Tap the "+" icon in the top header or bottom navigation. Select "Reel" or "Story", upload a video/photo, pick a caption and music track, then tap Share.',
    },
    {
      q: 'How do Close Friends stories work?',
      a: 'Manage your Close Friends in Settings > Close Friends. When sharing a story, choose "Close Friends" to share exclusively with people on that list.',
    },
  ];

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportText.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setReportText('');
    }, 600);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 no-scrollbar">
      {/* Account Status Card */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
        <ShieldCheck size={22} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
            Account Status: Good Standing
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-relaxed">
            Thank you for being a valued community member. You have no community guidelines violations.
          </p>
        </div>
      </div>

      {/* Report a Problem Form */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
          Report a Problem
        </h4>
        <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 space-y-3">
          <p className="text-xs text-neutral-500">
            Briefly explain what happened or what isn&apos;t working properly.
          </p>

          {isSubmitted ? (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center gap-2.5 text-blue-700 dark:text-blue-300 text-xs">
              <CheckCircle2 size={18} className="text-blue-500 shrink-0" />
              <span>Thank you! Your feedback has been received and logged.</span>
            </div>
          ) : (
            <form onSubmit={handleReportSubmit} className="space-y-2.5">
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="Describe the issue or suggestion in detail..."
                rows={3}
                className="w-full p-3 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white outline-none resize-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!reportText.trim() || isSubmitting}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send size={13} />
                <span>{isSubmitting ? 'Sending...' : 'Send Feedback'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Help Center FAQs */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
          Frequently Asked Questions
        </h4>
        <div className="space-y-1.5">
          {faqs.map((faq, idx) => {
            const isOpen = activeAccordion === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveAccordion(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-3 text-left cursor-pointer"
                >
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    {faq.q}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 pt-0 text-[11px] text-neutral-600 dark:text-neutral-400 border-t border-neutral-200/50 dark:border-neutral-700/50 pt-2 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
