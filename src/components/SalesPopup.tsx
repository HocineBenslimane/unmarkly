import { useState, useEffect } from 'react';
import { X, MessageCircle, Sparkles } from 'lucide-react';

interface SalesPopupProps {
  onClose: () => void;
}

export const SalesPopup: React.FC<SalesPopupProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 12000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  const handleWhatsAppClick = () => {
    window.open('https://wa.me/12012811325?text=Hi%20Unmarkly%2C%20I%27m%20interested%20in%20your%20watermark%20removal%20service.%20Can%20you%20tell%20me%20more%20about%20commercial%20or%20enterprise%20plans%3F', '_blank');
    setIsVisible(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => {
        setIsVisible(false);
        onClose();
      }} />

      <div className="relative w-full max-w-md bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl p-8 animate-slideIn glow-card-strong">
        <button
          onClick={() => {
            setIsVisible(false);
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full">
              <Sparkles className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Unlock Premium Features</h2>
          </div>
          <p className="text-slate-300 text-sm">
            Looking for unlimited downloads, faster processing, or API access?
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Unlimited Downloads</p>
              <p className="text-slate-400 text-xs">Remove watermarks from unlimited videos</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Priority Processing</p>
              <p className="text-slate-400 text-xs">Videos processed in 1-2 seconds</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Dedicated Support</p>
              <p className="text-slate-400 text-xs">Direct access to our support team</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-cyan-500/30 border border-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">API Integration</p>
              <p className="text-slate-400 text-xs">White-label and integrate into your app</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleWhatsAppClick}
          className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all font-semibold shadow-lg shadow-green-500/30 hover:shadow-green-500/50 glow-button"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Chat on WhatsApp</span>
        </button>

        <p className="text-center text-slate-400 text-xs mt-4">
          Direct messaging • Fast response • No spam
        </p>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};
