import React, { useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, Share2, ArrowLeft } from 'lucide-react';

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType?: 'image' | 'video' | 'gif';
  title?: string;
  senderName?: string;
  timestamp?: string;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  isOpen,
  onClose,
  mediaUrl,
  mediaType = 'image',
  title,
  senderName,
  timestamp,
}) => {
  const [zoom, setZoom] = React.useState(1);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mediaUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = `media_${Date.now()}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      id="media-lightbox-modal"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="w-full flex items-center justify-between text-white p-2 max-w-5xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="text-sm font-semibold">{senderName || 'Photo'}</div>
            {timestamp && <div className="text-xs text-neutral-400">{timestamp}</div>}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {mediaType === 'image' && (
            <>
              <button
                onClick={() => setZoom((prev) => Math.min(3, prev + 0.5))}
                className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={() => setZoom((prev) => Math.max(1, prev - 0.5))}
                className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>
            </>
          )}

          <button
            onClick={handleDownload}
            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Download"
          >
            <Download size={18} />
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Media Container */}
      <div
        className="flex-1 w-full flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {mediaType === 'video' ? (
          <video
            src={mediaUrl}
            controls
            autoPlay
            playsInline
            className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
          />
        ) : (
          <img
            src={mediaUrl}
            alt={title || 'Media preview'}
            referrerPolicy="no-referrer"
            style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl cursor-grab active:cursor-grabbing"
          />
        )}
      </div>

      {/* Caption footer if any */}
      {title && (
        <div
          className="w-full max-w-xl text-center py-2 text-white/90 text-sm bg-black/50 px-4 rounded-xl backdrop-blur-xs mb-2 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {title}
        </div>
      )}
    </div>
  );
};
