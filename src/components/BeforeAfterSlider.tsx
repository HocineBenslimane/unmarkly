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
    const syncVideos = () => {
      if (beforeVideoRef.current && afterVideoRef.current) {
        afterVideoRef.current.currentTime = beforeVideoRef.current.currentTime;
      }
    };

    const beforeVideo = beforeVideoRef.current;
    if (beforeVideo) {
      beforeVideo.addEventListener('timeupdate', syncVideos);
      return () => beforeVideo.removeEventListener('timeupdate', syncVideos);
    }
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleMouseDown = () => setIsDragging(true);

  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  };

  const togglePlayPause = () => {
    if (beforeVideoRef.current && afterVideoRef.current) {
      if (beforeVideoRef.current.paused) {
        beforeVideoRef.current.play();
        afterVideoRef.current.play();
      } else {
        beforeVideoRef.current.pause();
        afterVideoRef.current.pause();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl border border-slate-700 shadow-2xl bg-black cursor-pointer"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      onClick={togglePlayPause}
    >
      <div className="relative aspect-video">
        <video
          ref={afterVideoRef}
          src={afterVideo}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted
          playsInline
        />

        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <video
            ref={beforeVideoRef}
            src={beforeVideo}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            muted
            playsInline
          />
        </div>

        <div
          className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-lg cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-cyan-400 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-white rounded"></div>
              <div className="w-0.5 h-4 bg-white rounded"></div>
            </div>
          </div>
        </div>

        <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-semibold">
          Before
        </div>
        <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-semibold">
          After
        </div>
      </div>
    </div>
  );
}
