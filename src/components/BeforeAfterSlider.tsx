import { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  type: 'video';
  beforeVideo: string;
  afterVideo: string;
}

export function BeforeAfterSlider({ beforeVideo, afterVideo }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const beforeVid = beforeVideoRef.current;
    const afterVid = afterVideoRef.current;

    if (beforeVid && afterVid) {
      const syncVideos = () => {
        if (Math.abs(beforeVid.currentTime - afterVid.currentTime) > 0.1) {
          afterVid.currentTime = beforeVid.currentTime;
        }
      };

      beforeVid.addEventListener('timeupdate', syncVideos);
      beforeVid.addEventListener('play', () => afterVid.play());
      beforeVid.addEventListener('pause', () => afterVid.pause());
      beforeVid.addEventListener('seeking', () => {
        afterVid.currentTime = beforeVid.currentTime;
      });

      return () => {
        beforeVid.removeEventListener('timeupdate', syncVideos);
      };
    }
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);

  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden cursor-col-resize select-none border border-slate-700"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      <div className="absolute inset-0">
        <video
          ref={afterVideoRef}
          src={afterVideo}
          className="w-full h-full object-contain"
          loop
          muted
          playsInline
        />
      </div>

      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <video
          ref={beforeVideoRef}
          src={beforeVideo}
          className="w-full h-full object-contain"
          loop
          muted
          playsInline
          controls
        />
      </div>

      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex space-x-0.5">
            <div className="w-0.5 h-4 bg-slate-800"></div>
            <div className="w-0.5 h-4 bg-slate-800"></div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
        <span className="text-white text-sm font-medium">Before</span>
      </div>

      <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg">
        <span className="text-white text-sm font-medium">After</span>
      </div>
    </div>
  );
}
