import React from 'react';
import { X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PostCard } from './PostCard';

export const PostDetailModal: React.FC = () => {
  const { selectedPostForDetail, setSelectedPostForDetail } = useApp();

  if (!selectedPostForDetail) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="absolute inset-0"
        onClick={() => setSelectedPostForDetail(null)}
      />

      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl z-10">
        <button
          onClick={() => setSelectedPostForDetail(null)}
          className="absolute top-4 right-4 z-30 p-2 text-white bg-black/50 hover:bg-black/80 rounded-full backdrop-blur-md transition-colors"
        >
          <X size={20} />
        </button>

        <PostCard post={selectedPostForDetail} />
      </div>
    </div>
  );
};
