import { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  type: 'video' | 'image';
  beforeVideo?: string;
  afterVideo?: string;
  beforeImage?: string;
  afterImage?: string;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  type,
  beforeVideo,
  afterVideo,
  beforeImage,
  afterImage,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeVideoRef = useRef<HTMLVideoElement>(null);
  const afterVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (type === 'video' && beforeVideoRef.current && afterVideoRef.current) {
      const beforeVideo = beforeVideoRef.current;
      const afterVideo = afterVideoRef.current;

      const syncVideos = () => {
        afterVideo.currentTime = beforeVideo.currentTime;
      };

      beforeVideo.addEventListener('timeupdate', syncVideos);
      beforeVideo.addEventListener('play', () => afterVideo.play());
      beforeVideo.addEventListener('pause', () => afterVideo.pause());

      return () => {
        beforeVideo.removeEventListener('timeupdate', syncVideos);
      };
    }
  }, [type]);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches[0]) handleMove(e.touches[0].clientX);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl shadow-2xl border border-slate-700 select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
    >
      {type === 'video' ? (
        <>
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <video
              ref={beforeVideoRef}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              muted
              playsInline
              autoPlay
            >
              <source src={beforeVideo} type="video/mp4" />
            </video>
          </div>

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <video
              ref={afterVideoRef}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              muted
              playsInline
            >
              <source src={afterVideo} type="video/mp4" />
            </video>
          </div>
        </>
      ) : (
        <>
          <div className="relative w-full">
            <img
              src={beforeImage}
              alt="Before"
              className="w-full h-auto object-cover"
              draggable={false}
            />
          </div>

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <img
              src={afterImage}
              alt="After"
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
          </div>
        </>
      )}

      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex space-x-1">
            <div className="w-0.5 h-4 bg-slate-700"></div>
            <div className="w-0.5 h-4 bg-slate-700"></div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold">
        Before
      </div>
      <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm font-semibold">
        After
      </div>
    </div>
  );
};
