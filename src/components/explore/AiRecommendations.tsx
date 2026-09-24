import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, RefreshCw, Compass, ArrowRight, Bot, Lightbulb, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface RecommendationCluster {
  title: string;
  reason: string;
  tags: string[];
  emoji: string;
  description: string;
}

interface AiRecommendationsProps {
  activeCategory: string;
  onSelectTag: (tag: string) => void;
  onApplyAiQuery: (query: string, aiInsight?: string) => void;
}

export const AiRecommendations: React.FC<AiRecommendationsProps> = ({
  activeCategory,
  onSelectTag,
  onApplyAiQuery,
}) => {
  const { currentUser, posts } = useApp();
  const [clusters, setClusters] = useState<RecommendationCluster[]>([]);
  const [smartPrompt, setSmartPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Fetch AI Recommendations from server (or fallback)
  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      // Gather context from posts
      const recentTags = posts
        .slice(0, 10)
        .flatMap((p) => p.tags || [])
        .slice(0, 8);

      const res = await fetch('/api/gemini/explore-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activeCategory,
          userInterests: ['photography', 'design', 'lifestyle', 'travel'],
          recentTags,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.clusters && data.clusters.length > 0) {
          setClusters(data.clusters);
          setSmartPrompt(data.smartPrompt || 'AI Curated discovery based on community trends.');
          return;
        }
      }
    } catch (err) {
      console.error('AI recommendation error:', err);
    } finally {
      setIsLoading(false);
    }

    // Default curated fallback clusters
    setClusters([
      {
        title: 'Golden Hour Cinematic',
        reason: 'Surging in photography trends',
        tags: ['#goldenhour', '#cinematic', '#filmphotography'],
        emoji: '🌅',
        description: 'Warm natural tones, dramatic backlights, and analog aesthetic.'
      },
      {
        title: 'Nordic & Minimal Geometry',
        reason: 'High engagement across design creators',
        tags: ['#minimalism', '#architecture', '#design'],
        emoji: '🏛️',
        description: 'Clean spatial lines and serene neutral palettes.'
      },
      {
        title: 'Cyberpunk & Night Lights',
        reason: 'Trending in urban nightlife',
        tags: ['#neon', '#nightphotography', '#tokyo', '#cyberpunk'],
        emoji: '🌃',
        description: 'Vibrant neon hues and wet asphalt reflections.'
      },
      {
        title: 'Artisanal Cafe Aesthetics',
        reason: 'Popular in lifestyle discover feeds',
        tags: ['#coffeetime', '#cafevibes', '#matcha'],
        emoji: '☕',
        description: 'Soft daylight, craft espresso, and cozy interior details.'
      }
    ]);
    setSmartPrompt('Curated visual moods tailored to your aesthetic.');
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRecommendations();
  }, [activeCategory]);

  const handleAiSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPromptInput.trim()) return;

    setIsAiSearching(true);
    try {
      const res = await fetch('/api/gemini/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiPromptInput.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        const keywords = data.keywords?.join(' ') || aiPromptInput.trim();
        setAiInsight(data.aiInsight || `AI mapped to: ${keywords}`);
        onApplyAiQuery(keywords, data.aiInsight);
      } else {
        onApplyAiQuery(aiPromptInput.trim());
      }
    } catch (err) {
      onApplyAiQuery(aiPromptInput.trim());
    } finally {
      setIsAiSearching(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-pink-50/50 dark:from-neutral-900 dark:via-neutral-900/90 dark:to-neutral-950 rounded-3xl p-4 sm:p-6 border border-purple-200/60 dark:border-purple-900/30 shadow-soft space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 to-indigo-600 text-white flex items-center justify-center shadow-soft-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              AI Recommendations
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                Gemini 3.7
              </span>
            </h3>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {smartPrompt}
            </p>
          </div>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={isLoading}
          className="p-2 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-neutral-800 transition-all cursor-pointer disabled:opacity-50"
          title="Refresh AI recommendations"
        >
          <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Natural Language "Ask AI Explorer" Input */}
      <form onSubmit={handleAiSearchSubmit} className="relative">
        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-neutral-800/90 rounded-2xl border border-purple-200/60 dark:border-purple-900/40 shadow-soft-xs focus-within:border-purple-500 transition-colors">
          <Bot size={16} className="text-purple-500 flex-shrink-0" />
          <input
            type="text"
            value={aiPromptInput}
            onChange={(e) => setAiPromptInput(e.target.value)}
            placeholder="Ask AI: 'cozy rainy cafe in Tokyo' or 'minimalist film vibe'..."
            className="w-full text-xs bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
          />
          <button
            type="submit"
            disabled={isAiSearching || !aiPromptInput.trim()}
            className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-[11px] font-bold shadow-soft-xs hover:opacity-90 disabled:opacity-40 transition-all cursor-pointer flex-shrink-0"
          >
            {isAiSearching ? 'Synthesizing...' : 'Explore'}
          </button>
        </div>
      </form>

      {/* AI Clusters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {clusters.map((cluster, idx) => (
          <motion.div
            key={cluster.title + idx}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className="p-3.5 bg-white/90 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl border border-purple-100 dark:border-neutral-700/80 shadow-soft-xs space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{cluster.emoji}</span>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                    {cluster.title}
                  </h4>
                  <p className="text-[10px] font-medium text-purple-600 dark:text-purple-400">
                    {cluster.reason}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2">
              {cluster.description}
            </p>

            {/* Tags strip */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {cluster.tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onSelectTag(tag)}
                  className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
