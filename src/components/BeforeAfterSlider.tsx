import { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  type: 'video';
  beforeVideo: string;
  afterVideo: string;
}

export function BeforeAfterSlider({ beforeVideo, afterVideo }: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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

  const togglePlayPause = () => {
    if (isDragging) return;

    if (beforeVideoRef.current && afterVideoRef.current) {
      if (beforeVideoRef.current.paused) {
        const beforePromise = beforeVideoRef.current.play();
        const afterPromise = afterVideoRef.current.play();

        Promise.all([beforePromise, afterPromise])
          .then(() => {
            setIsPlaying(true);
          })
          .catch(err => console.error('Error playing videos:', err));
      } else {
        beforeVideoRef.current.pause();
        afterVideoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const showBeforeLabel = sliderPosition > 15;
  const showAfterLabel = sliderPosition < 85;

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl border border-slate-700 shadow-2xl bg-black cursor-pointer select-none"
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
          className="absolute top-0 bottom-0 w-1 bg-cyan-400 shadow-lg cursor-ew-resize z-10"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-cyan-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
            <div className="flex space-x-0.5">
              <div className="w-0.5 h-4 bg-white rounded"></div>
              <div className="w-0.5 h-4 bg-white rounded"></div>
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

        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
