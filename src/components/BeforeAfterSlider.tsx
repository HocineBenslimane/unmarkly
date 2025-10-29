import { useState, useRef, useEffect } from 'react';
import { MoveHorizontal } from 'lucide-react';

interface BeforeAfterSliderProps {
  beforeImage?: string;
  afterImage?: string;
  beforeVideo?: string;
  afterVideo?: string;
  type?: 'image' | 'video';
}

export function BeforeAfterSlider({ beforeImage, afterImage, beforeVideo, afterVideo, type = 'image' }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video overflow-hidden rounded-xl border-2 border-slate-700 cursor-ew-resize select-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* After Content (Full) */}
      <div className="absolute inset-0">
        {type === 'video' && afterVideo ? (
          <video
            src={afterVideo}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={afterImage}
            alt="After - Watermark Removed"
            className="w-full h-full object-cover"
            draggable={false}
          />
        )}
        <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
          AFTER
        </div>
      </div>

      {/* Before Content (Clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        {type === 'video' && beforeVideo ? (
          <video
            src={beforeVideo}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <img
            src={beforeImage}
            alt="Before - With Watermark"
            className="w-full h-full object-cover"
            draggable={false}
          />
        )}
        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
          BEFORE
        </div>
      </div>

      {/* Slider Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Slider Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center cursor-ew-resize border-4 border-cyan-400">
          <MoveHorizontal className="w-6 h-6 text-cyan-600" />
        </div>
      </div>
    </div>
  );
}
