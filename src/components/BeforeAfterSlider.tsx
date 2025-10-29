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
  const syncingRef = useRef(false);

  useEffect(() => {
    const beforeVid = beforeVideoRef.current;
    const afterVid = afterVideoRef.current;

    if (!beforeVid || !afterVid) return;

    const syncFromBefore = () => {
      if (syncingRef.current || !beforeVid || !afterVid) return;

      const timeDiff = Math.abs(afterVid.currentTime - beforeVid.currentTime);
      if (timeDiff > 0.3) {
        syncingRef.current = true;
        afterVid.currentTime = beforeVid.currentTime;
        setTimeout(() => {
          syncingRef.current = false;
        }, 100);
      }
    };

    const syncFromAfter = () => {
      if (syncingRef.current || !beforeVid || !afterVid) return;

      const timeDiff = Math.abs(beforeVid.currentTime - afterVid.currentTime);
      if (timeDiff > 0.3) {
        syncingRef.current = true;
        beforeVid.currentTime = afterVid.currentTime;
        setTimeout(() => {
          syncingRef.current = false;
        }, 100);
      }
    };

    const handleLoadedBefore = () => {
      if (afterVid.readyState >= 2) {
        beforeVid.currentTime = afterVid.currentTime;
      }
    };

    const handleLoadedAfter = () => {
      if (beforeVid.readyState >= 2) {
        afterVid.currentTime = beforeVid.currentTime;
      }
    };

    beforeVid.addEventListener('loadeddata', handleLoadedBefore);
    afterVid.addEventListener('loadeddata', handleLoadedAfter);
    beforeVid.addEventListener('seeked', syncFromBefore);
    afterVid.addEventListener('seeked', syncFromAfter);

    const playVideos = () => {
      Promise.all([beforeVid.play(), afterVid.play()])
        .catch(err => console.error('Error auto-playing videos:', err));
    };

    if (beforeVid.readyState >= 3 && afterVid.readyState >= 3) {
      playVideos();
    } else {
      const checkReady = () => {
        if (beforeVid.readyState >= 3 && afterVid.readyState >= 3) {
          playVideos();
        }
      };
      beforeVid.addEventListener('canplay', checkReady);
      afterVid.addEventListener('canplay', checkReady);

      return () => {
        beforeVid.removeEventListener('loadeddata', handleLoadedBefore);
        afterVid.removeEventListener('loadeddata', handleLoadedAfter);
        beforeVid.removeEventListener('seeked', syncFromBefore);
        afterVid.removeEventListener('seeked', syncFromAfter);
        beforeVid.removeEventListener('canplay', checkReady);
        afterVid.removeEventListener('canplay', checkReady);
      };
    }

    return () => {
      beforeVid.removeEventListener('loadeddata', handleLoadedBefore);
      afterVid.removeEventListener('loadeddata', handleLoadedAfter);
      beforeVid.removeEventListener('seeked', syncFromBefore);
      afterVid.removeEventListener('seeked', syncFromAfter);
    };
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(percentage, 0), 100));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleMove(e.clientX);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleMove(e.clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    }
  };

  const showBeforeLabel = sliderPosition > 15;
  const showAfterLabel = sliderPosition < 85;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl border border-slate-700 shadow-2xl bg-black select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      <div className="relative aspect-video">
        <video
          ref={afterVideoRef}
          src={afterVideo}
          className="absolute inset-0 w-full h-full object-cover"
          loop
          muted
          playsInline
          preload="auto"
        />

        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <video
            ref={beforeVideoRef}
            src={beforeVideo}
            className="absolute inset-0 w-full h-full object-cover"
            loop
            muted
            playsInline
            preload="auto"
          />
        </div>

        <div
          className="slider-handle absolute top-0 bottom-0 w-0.5 cursor-ew-resize z-10 transition-all duration-200"
          style={{
            left: `${sliderPosition}%`,
            background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.8), rgba(139, 92, 246, 0.9), rgba(59, 130, 246, 0.8))'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full transition-all duration-200 ${isDragging ? 'scale-110' : 'hover:scale-105'}`}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95))',
              backdropFilter: 'blur(12px)',
              boxShadow: isDragging
                ? '0 0 35px rgba(59, 130, 246, 0.6), 0 0 20px rgba(139, 92, 246, 0.4), inset 0 2px 10px rgba(255, 255, 255, 0.5)'
                : '0 0 25px rgba(59, 130, 246, 0.5), 0 0 15px rgba(139, 92, 246, 0.3), inset 0 2px 10px rgba(255, 255, 255, 0.4)'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-2">
              <img
                src="/unmarkly-logo copy.png"
                alt="Slider"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>
          </div>
        </div>

        {showBeforeLabel && (
          <div className="absolute top-4 left-4 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(148, 163, 184, 0.9), rgba(100, 116, 139, 0.9))',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 3px rgba(255, 255, 255, 0.2)'
            }}
          >
            Before
          </div>
        )}

        {showAfterLabel && (
          <div className="absolute top-4 right-4 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-opacity duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.9))',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4), inset 0 1px 3px rgba(255, 255, 255, 0.2)'
            }}
          >
            After
          </div>
        )}
      </div>
    </div>
  );
}
