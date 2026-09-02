import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  RotateCw,
  FlipHorizontal,
  ZoomIn,
  ZoomOut,
  Check,
  X,
  RefreshCw,
  Maximize2,
  Grid3X3,
  Sliders,
  Move,
} from 'lucide-react';

export type CropAspectRatio = '1:1' | '4:5' | '16:9' | '9:16' | 'original';

interface ImageCropperProps {
  imageSrc: string;
  initialAspectRatio?: CropAspectRatio;
  onCropComplete: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  initialAspectRatio = '1:1',
  onCropComplete,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<CropAspectRatio>(initialAspectRatio);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load natural dimensions of the image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [imageSrc]);

  // Compute crop box aspect ratio numeric value
  const getAspectRatioValue = useCallback((): number => {
    if (aspectRatio === '1:1') return 1;
    if (aspectRatio === '4:5') return 4 / 5;
    if (aspectRatio === '16:9') return 16 / 9;
    if (aspectRatio === '9:16') return 9 / 16;
    if (aspectRatio === 'original' && imageSize.width > 0 && imageSize.height > 0) {
      const isRotated90or270 = rotation % 180 !== 0;
      return isRotated90or270
        ? imageSize.height / imageSize.width
        : imageSize.width / imageSize.height;
    }
    return 1;
  }, [aspectRatio, imageSize, rotation]);

  // Handle Drag / Pan Events
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if capture already released
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.0015;
    setZoom((prev) => Math.min(Math.max(prev + delta, 1), 3));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleToggleFlip = () => {
    setFlipH((prev) => !prev);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setOffset({ x: 0, y: 0 });
    setAspectRatio('1:1');
  };

  // Export cropped image via HTML5 Canvas
  const handleApplyCrop = () => {
    if (!imageSize.width || !imageSize.height) return;
    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      const targetRatio = getAspectRatioValue();
      
      // Define export output dimensions (standard Instagram high-res output)
      let outWidth = 1080;
      let outHeight = Math.round(1080 / targetRatio);

      // Clamp output canvas size to high quality
      if (outHeight > 1920) {
        outHeight = 1920;
        outWidth = Math.round(1920 * targetRatio);
      }

      canvas.width = outWidth;
      canvas.height = outHeight;

      // Fill background black or transparent
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, outWidth, outHeight);

      ctx.save();
      // Move to center of canvas
      ctx.translate(outWidth / 2, outHeight / 2);

      // Apply User Offsets (scaled proportionally to export resolution)
      // Estimate scale factor between container crop viewport and output canvas
      const container = containerRef.current;
      const containerRect = container ? container.getBoundingClientRect() : { width: 400, height: 400 };
      const scaleToCanvas = outWidth / Math.max(containerRect.width, 1);

      ctx.translate(offset.x * scaleToCanvas, offset.y * scaleToCanvas);

      // Apply Rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply Flip
      ctx.scale(flipH ? -1 : 1, 1);

      // Calculate how image covers the canvas with current zoom
      const isRotated = rotation % 180 !== 0;
      const naturalW = isRotated ? img.naturalHeight : img.naturalWidth;
      const naturalH = isRotated ? img.naturalWidth : img.naturalHeight;

      // Base scale to cover canvas area
      const baseScale = Math.max(outWidth / naturalW, outHeight / naturalH);
      const totalScale = baseScale * zoom;

      const drawW = img.naturalWidth * totalScale;
      const drawH = img.naturalHeight * totalScale;

      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.95);
      setIsProcessing(false);
      onCropComplete(croppedUrl);
    };

    img.onerror = () => {
      setIsProcessing(false);
    };
  };

  const ratioOptions: { id: CropAspectRatio; label: string; desc: string }[] = [
    { id: '1:1', label: '1:1', desc: 'Square' },
    { id: '4:5', label: '4:5', desc: 'Portrait' },
    { id: '16:9', label: '16:9', desc: 'Landscape' },
    { id: '9:16', label: '9:16', desc: 'Story / Reel' },
    { id: 'original', label: 'Original', desc: 'Free' },
  ];

  const currentRatioNum = getAspectRatioValue();

  return (
    <div className="flex flex-col h-full bg-neutral-950 text-white select-none">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
        >
          <X size={16} /> Cancel
        </button>

        <div className="flex items-center gap-2">
          <Crop size={16} className="text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
            Format & Crop
          </span>
        </div>

        <button
          type="button"
          onClick={handleApplyCrop}
          disabled={isProcessing}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/30 active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
        >
          {isProcessing ? (
            <span>Processing...</span>
          ) : (
            <>
              <Check size={14} /> Done
            </>
          )}
        </button>
      </div>

      {/* Main Interactive Crop Workspace */}
      <div
        className="flex-1 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-neutral-950"
        onWheel={handleWheel}
      >
        {/* Dynamic Aspect Ratio Crop Box Container */}
        <div
          ref={containerRef}
          style={{
            aspectRatio: `${currentRatioNum}`,
            maxHeight: 'min(62vh, 480px)',
            maxWidth: 'min(88vw, 520px)',
          }}
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 bg-black cursor-grab active:cursor-grabbing touch-none flex items-center justify-center"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {/* Image Transform Layer */}
          <div
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${
                flipH ? -zoom : zoom
              }, ${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
            className="w-full h-full flex items-center justify-center pointer-events-none"
          >
            <img
              src={imageSrc}
              alt="Crop target"
              referrerPolicy="no-referrer"
              className="max-w-none w-full h-full object-cover select-none pointer-events-none"
              draggable={false}
            />
          </div>

          {/* Rule-of-Thirds Grid Overlay */}
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20 transition-opacity">
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-r border-b border-white/25" />
              <div className="border-b border-white/25" />
              <div className="border-r border-white/25" />
              <div className="border-r border-white/25" />
              <div />
            </div>
          )}

          {/* Drag instruction badge */}
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-white/80 font-medium flex items-center gap-1.5 pointer-events-none border border-white/10">
            <Move size={11} /> Drag to adjust position
          </div>
        </div>
      </div>

      {/* Bottom Tool Controls */}
      <div className="p-3 sm:p-4 bg-neutral-900 border-t border-neutral-800/80 space-y-3">
        {/* Aspect Ratio Selector Pills */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {ratioOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setAspectRatio(opt.id);
                setOffset({ x: 0, y: 0 });
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center flex-shrink-0 cursor-pointer ${
                aspectRatio === opt.id
                  ? 'bg-white text-neutral-950 shadow-md scale-105'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              <span>{opt.label}</span>
              <span className="text-[9px] opacity-75 font-medium">{opt.desc}</span>
            </button>
          ))}
        </div>

        {/* Zoom, Rotation & Grid Tools */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2 flex-1 min-w-[180px] max-w-xs bg-neutral-800/70 px-3 py-1.5 rounded-xl border border-neutral-700/50">
            <ZoomOut
              size={15}
              className="text-neutral-400 cursor-pointer hover:text-white"
              onClick={() => setZoom((prev) => Math.max(prev - 0.2, 1))}
            />
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <ZoomIn
              size={15}
              className="text-neutral-400 cursor-pointer hover:text-white"
              onClick={() => setZoom((prev) => Math.min(prev + 0.2, 3))}
            />
            <span className="text-[11px] font-mono text-neutral-400 w-8 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          {/* Action Tool Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleRotate}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Rotate 90°"
            >
              <RotateCw size={15} />
              <span className="hidden sm:inline">Rotate</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFlip}
              className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                flipH
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white'
              }`}
              title="Flip Horizontal"
            >
              <FlipHorizontal size={15} />
              <span className="hidden sm:inline">Flip</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGrid((prev) => !prev)}
              className={`p-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                showGrid
                  ? 'bg-neutral-700 text-white'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white'
              }`}
              title="Toggle Grid Lines"
            >
              <Grid3X3 size={15} />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-red-400 rounded-xl transition-colors cursor-pointer"
              title="Reset Crop & Orientation"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
