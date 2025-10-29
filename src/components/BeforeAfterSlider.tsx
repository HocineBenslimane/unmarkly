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
          className="slider-handle absolute top-0 bottom-0 w-1 bg-white/50 shadow-lg cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-white shadow-2xl overflow-hidden">
            <div className="absolute inset-0 flex">
              <div className="w-1/2 bg-red-500 flex items-center justify-end pr-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="w-1/2 bg-green-500 flex items-center justify-start pl-1">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {showBeforeLabel && (
          <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-semibold transition-opacity duration-200">
            Before
          </div>
        )}

        {showAfterLabel && (
          <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-semibold transition-opacity duration-200">
            After
          </div>
        )}
      </div>
    </div>
  );
}
