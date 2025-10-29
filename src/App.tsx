import { useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Loader2, Download, Link as LinkIcon, Copy, PlayCircle, ChevronDown, ChevronUp, Clock, ShieldAlert } from 'lucide-react';
import { removeWatermark, VideoQuality } from './services/api';
import { validateSoraUrl } from './utils/validation';
import { getFingerprint, getFingerprintComponents, FingerprintComponents } from './utils/fingerprint';
import { checkRateLimit, RateLimitStatus, initializePageLoadTime, trackBehavioralSignal } from './utils/rateLimit';
import { getTimeRemaining } from './utils/timeFormat';
import { BeforeAfterSlider } from './components/BeforeAfterSlider';
import { detectIncognito } from './utils/incognitoDetection';

interface ProcessResult {
  videos: VideoQuality[];
  message?: string;
}

function App() {
  const [soraUrl, setSoraUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [fingerprint, setFingerprint] = useState<string>('');
  const [fingerprintComponents, setFingerprintComponents] = useState<FingerprintComponents | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitStatus | null>(null);
  const [isLoadingFingerprint, setIsLoadingFingerprint] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isIncognito, setIsIncognito] = useState(false);

  useEffect(() => {
    initializePageLoadTime();

    const initFingerprint = async () => {
      try {
        const incognitoDetected = await detectIncognito();

        if (incognitoDetected) {
          setIsIncognito(true);
          setError('Incognito/Private browsing mode detected. Please use a regular browser window to access this service.');
          setIsLoadingFingerprint(false);
          return;
        }

        const fp = await getFingerprint();
        const components = await getFingerprintComponents();
        setFingerprint(fp);
        setFingerprintComponents(components);
        const limitStatus = await checkRateLimit(fp, components);
        setRateLimit(limitStatus);

        if (limitStatus.blocked) {
          setError(limitStatus.message || 'Access blocked due to suspicious activity');
        }
      } catch (err) {
        console.error('Failed to initialize fingerprint:', err);
      } finally {
        setIsLoadingFingerprint(false);
      }
    };

    initFingerprint();
  }, []);

  useEffect(() => {
    if (!rateLimit || rateLimit.allowed) return;

    const updateTimer = () => {
      const remaining = getTimeRemaining(rateLimit.resetAt);
      setTimeRemaining(remaining);

      if (remaining === '0h 0m') {
        if (fingerprint && fingerprintComponents) {
          checkRateLimit(fingerprint, fingerprintComponents).then(setRateLimit);
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);

    return () => clearInterval(interval);
  }, [rateLimit, fingerprint]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSoraUrl(e.target.value);
    setError('');
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateSoraUrl(soraUrl)) {
      setError('Please enter a valid Sora AI video URL (e.g., https://sora.chatgpt.com/p/VIDEO_ID)');
      return;
    }

    if (!fingerprint) {
      setError('Unable to verify device identity. Please refresh the page.');
      return;
    }

    await trackBehavioralSignal(fingerprint, 'submit_url', { url: soraUrl });

    try {
      const limitStatus = await checkRateLimit(fingerprint, fingerprintComponents || undefined);
      setRateLimit(limitStatus);

      if (limitStatus.blocked) {
        setError('Your access has been blocked due to suspicious activity. Please contact support if you believe this is an error.');
        return;
      }

      if (!limitStatus.allowed) {
        const resetDate = new Date(limitStatus.resetAt);
        const timeUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60));
        setError(`Rate limit exceeded. You have used all 3 downloads. Please try again in ${timeUntilReset} hours.`);
        return;
      }
    } catch (err) {
      console.error('Rate limit check failed:', err);
    }

    setIsProcessing(true);
    setProgress(0);
    setError('');
    setResult(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      const data = await removeWatermark(soraUrl, fingerprint);
      clearInterval(progressInterval);
      setProgress(100);

      const updatedLimitStatus = await checkRateLimit(fingerprint, fingerprintComponents || undefined);
      setRateLimit(updatedLimitStatus);

      setTimeout(() => {
        setResult(data);
        setIsProcessing(false);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : 'Failed to process video. Please try again.');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleCopyUrl = async (url: string, index: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      await trackBehavioralSignal(fingerprint, 'copy_url', { index });
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = async (url: string, filename: string = 'sora-video.mp4', index: number = 0) => {
    if (downloadingIndex !== null) return;

    setDownloadingIndex(index);
    setDownloadProgress(0);

    await trackBehavioralSignal(fingerprint, 'download_video', { filename, index });

    try {
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-video?url=${encodeURIComponent(url)}`;

      const response = await fetch(proxyUrl, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          if (total > 0) {
            const percentComplete = Math.round((receivedLength / total) * 100);
            setDownloadProgress(percentComplete);
          } else {
            setDownloadProgress(Math.min(receivedLength / 100000 * 10, 90));
          }
        }
      }

      setDownloadProgress(100);

      const blob = new Blob(chunks);
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);

      setTimeout(() => {
        setSoraUrl('');
        setResult(null);
        setError('');
        setShowAlternatives(false);
        setDownloadProgress(0);
      }, 1500);
    } catch (err) {
      console.error('Download failed:', err);
      window.open(url, '_blank');
    } finally {
      setDownloadingIndex(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Upload className="w-8 h-8 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Unmarkly</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#how-it-works" className="text-slate-400 hover:text-cyan-400 transition-colors">How It Works</a>
              <a href="#features" className="text-slate-400 hover:text-cyan-400 transition-colors">Features</a>
              <a href="#faq" className="text-slate-400 hover:text-cyan-400 transition-colors">FAQ</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Unmarkly
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mt-2 glow-text">Free Sora AI Watermark Remover & Video Downloader</span>
          </h1>
          <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto">
            Download Sora AI videos without watermarks in HD quality. See the before-and-after comparison below, then try it yourself - no login or signup required.
          </p>

          {/* Feature Badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <div className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2 glow-card">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-slate-200 font-medium">100% Free</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2 glow-card">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-slate-200 font-medium">Instant Results</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2 glow-card">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-slate-200 font-medium">HD Quality</span>
            </div>
          </div>
        </div>

        {/* Before/After Comparison Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            See the Difference
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            Drag the slider to see how Unmarkly removes Sora watermarks while maintaining perfect quality
          </p>
          <div className="mb-8">
            <BeforeAfterSlider
              type="video"
              beforeVideo="https://pub-965c9a45ceae4772bb5e4e2b30f64003.r2.dev/sora-with-watermark.mp4"
              afterVideo="https://pub-965c9a45ceae4772bb5e4e2b30f64003.r2.dev/sora-without-watermark.mp4"
            />
          </div>
          <div className="text-center mb-12">
            <p className="text-slate-400 text-sm">
              <span className="inline-flex items-center space-x-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                <span>Before: With Sora watermark</span>
              </span>
              <span className="mx-4 text-slate-600">•</span>
              <span className="inline-flex items-center space-x-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span>After: Clean, watermark-free</span>
              </span>
            </p>
          </div>

          {/* Transitional Call-to-Action */}
          <div className="text-center mb-16">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Ready to Remove Watermarks from Your Videos?
            </h3>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Paste your Sora AI video URL below and get your watermark-free video in seconds
            </p>
          </div>
        </div>

        {/* Incognito Mode Warning */}
        {isIncognito && (
          <div className="max-w-3xl mx-auto mb-8 px-4 sm:px-6 lg:px-8">
            <div className="bg-red-900/30 backdrop-blur-sm border-2 border-red-700/50 rounded-2xl shadow-2xl p-8 animate-fadeIn">
              <div className="flex items-start space-x-4">
                <ShieldAlert className="w-12 h-12 text-red-400 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Incognito Mode Detected</h3>
                  <p className="text-red-200 mb-4 leading-relaxed">
                    Our service cannot function in private/incognito browsing mode due to browser security restrictions. This is necessary to prevent abuse and maintain fair access for all users.
                  </p>
                  <div className="bg-red-950/50 border border-red-800/50 rounded-lg p-4">
                    <p className="text-red-300 font-semibold mb-2">To continue:</p>
                    <ol className="list-decimal list-inside space-y-1 text-red-200 text-sm">
                      <li>Close this incognito/private window</li>
                      <li>Open a regular browser window</li>
                      <li>Return to this website</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Input Form */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-8 glow-card">
              <div className="mb-6">
                <label htmlFor="soraUrl" className="block text-left text-sm font-medium text-slate-300 mb-2">
                  Enter Sora AI Video URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    id="soraUrl"
                    value={soraUrl}
                    onChange={handleUrlChange}
                    placeholder="https://sora.chatgpt.com/p/VIDEO_ID"
                    className="w-full pl-12 pr-4 py-4 bg-slate-900/80 border-2 border-slate-700 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 outline-none transition-all text-white placeholder-slate-500"
                    disabled={isIncognito || isProcessing}
                  />
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-900/30 border border-red-800/50 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {isProcessing && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-300">Removing watermark...</span>
                    <span className="text-sm font-medium text-cyan-400">{progress}%</span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">This usually takes 5-10 seconds</div>
                  <div className="h-2.5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 transition-all duration-300 ease-out glow-progress"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isIncognito || isProcessing || !soraUrl || isLoadingFingerprint || (rateLimit && !rateLimit.allowed)}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-4 px-8 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 glow-button"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Remove Watermark</span>
                  </>
                )}
              </button>
            </form>

            {/* Downloads Remaining Section */}
            {!isLoadingFingerprint && rateLimit && (
              <div className="mt-6 text-center">
                {rateLimit.remaining > 0 ? (
                  <div className="inline-flex items-center space-x-2 bg-slate-800/70 backdrop-blur-sm border border-slate-700 rounded-full px-6 py-3">
                    <span className="text-slate-300 font-medium">Downloads remaining:</span>
                    <span className="text-2xl font-bold text-cyan-400">{rateLimit.remaining}/3</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-3 bg-red-900/20 backdrop-blur-sm border border-red-700/50 rounded-full px-6 py-3">
                    <Clock className="w-5 h-5 text-red-400" />
                    <span className="text-slate-300 font-medium">Limit reached. Reset in:</span>
                    <span className="text-2xl font-bold text-red-400">{timeRemaining}</span>
                  </div>
                )}
              </div>
            )}

            {/* Results Section */}
            {result && result.videos.length > 0 && (
              <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-8 animate-fadeIn glow-card">
                <div className="flex items-center space-x-3 mb-6">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <h3 className="text-2xl font-bold text-white">Success!</h3>
                </div>

                {/* Video Preview */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <PlayCircle className="w-5 h-5 text-cyan-400" />
                    <h4 className="text-lg font-semibold text-white">Video Preview</h4>
                  </div>
                  <div className="bg-black/50 rounded-xl overflow-hidden shadow-lg border border-slate-700">
                    <video
                      controls
                      className="w-full h-auto"
                      preload="metadata"
                    >
                      <source src={result.videos[0].url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>

                {/* Main Download Button */}
                <div className="mb-6">
                  <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/30 rounded-xl p-6 glow-card-strong">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg font-bold text-white">
                            {result.videos[0].type}
                          </span>
                          <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-full glow-badge">
                            RECOMMENDED
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          Best quality download - Priority {result.videos[0].priority}
                        </p>
                      </div>
                    </div>
                    {downloadingIndex === 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                            <span className="text-slate-300 font-medium">Downloading...</span>
                          </div>
                          <span className="text-sm font-medium text-cyan-400">{downloadProgress}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 transition-all duration-300 ease-out glow-progress"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleCopyUrl(result.videos[0].url, 0)}
                          className="flex items-center space-x-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600 font-medium"
                        >
                          <Copy className="w-4 h-4" />
                          <span>{copiedIndex === 0 ? 'Copied!' : 'Copy URL'}</span>
                        </button>
                        <button
                          onClick={() => handleDownload(result.videos[0].url, 'sora-video-hd.mp4', 0)}
                          disabled={downloadingIndex !== null}
                          className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg transition-all font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed glow-button"
                        >
                          <Download className="w-5 h-5" />
                          <span>Download Video</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alternative Downloads */}
                {result.videos.length > 1 && (
                  <div>
                    <button
                      onClick={() => setShowAlternatives(!showAlternatives)}
                      className="w-full flex items-center justify-between p-4 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg transition-colors mb-3 border border-slate-600"
                    >
                      <span className="text-sm font-medium text-slate-300">
                        Alternative Downloads ({result.videos.length - 1} available)
                      </span>
                      {showAlternatives ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    {showAlternatives && (
                      <div className="space-y-3 animate-fadeIn">
                        {result.videos.slice(1).map((video, index) => (
                          <div key={index + 1} className="border border-slate-600 rounded-lg p-4 bg-slate-800/50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="text-sm font-semibold text-white">
                                    {video.type}
                                  </span>
                                  <span className="px-2 py-0.5 text-xs font-medium bg-slate-700 text-slate-300 rounded-full">
                                    {video.quality.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">
                                  Priority {video.priority} - Use if main download fails
                                </p>
                              </div>
                              {downloadingIndex === index + 1 ? (
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center space-x-2">
                                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                                      <span className="text-xs text-slate-300 font-medium">Downloading...</span>
                                    </div>
                                    <span className="text-xs font-medium text-cyan-400">{downloadProgress}%</span>
                                  </div>
                                  <div className="h-1.5 bg-slate-900/80 rounded-full overflow-hidden border border-slate-700">
                                    <div
                                      className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 transition-all duration-300 ease-out glow-progress"
                                      style={{ width: `${downloadProgress}%` }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleCopyUrl(video.url, index + 1)}
                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors border border-slate-600"
                                  >
                                    <Copy className="w-4 h-4" />
                                    <span>{copiedIndex === index + 1 ? 'Copied!' : 'Copy'}</span>
                                  </button>
                                  <button
                                    onClick={() => handleDownload(video.url, `sora-video-${video.quality}.mp4`, index + 1)}
                                    disabled={downloadingIndex !== null}
                                    className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gradient-to-r from-cyan-700 to-blue-700 hover:from-cyan-600 hover:to-blue-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span>Download</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 p-4 bg-amber-900/20 border border-amber-700/50 rounded-lg">
                      <p className="text-sm text-amber-400">
                        <strong>Note:</strong> If the main download doesn't work, try the alternative options above.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            How to Remove Sora Watermark
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            Our Sora watermark remover makes it easy to download clean, professional videos from OpenAI Sora
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 glow-icon">
                <LinkIcon className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">1. Copy Sora AI Video URL</h3>
              <p className="text-slate-400">Get your Sora AI video generator link from sora.chatgpt.com (OpenAI Sora login required for source video).</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 glow-icon">
                <Loader2 className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">2. Process with Sora AI Tool</h3>
              <p className="text-slate-400">Our free Sora AI video maker removes watermarks instantly while maintaining original HD quality.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 glow-icon">
                <Download className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">3. Download Sora AI Video</h3>
              <p className="text-slate-400">Get your watermark-free Sora AI video free in HD. Best alternative to paid Sora AI generators.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-slate-900/50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Why Choose Our Sora Video Downloader
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            The most reliable free tool to remove watermarks from Sora AI videos and download them
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-md glow-card">
              <CheckCircle className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">100% Free Sora Tool</h3>
              <p className="text-slate-400 text-sm">Remove Sora watermarks completely free. No hidden costs or subscriptions ever.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-md glow-card">
              <CheckCircle className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Instant Sora Processing</h3>
              <p className="text-slate-400 text-sm">Download Sora videos without watermarks in seconds, not minutes.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-md glow-card">
              <CheckCircle className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">HD Quality Downloads</h3>
              <p className="text-slate-400 text-sm">Download Sora AI videos in original HD quality without any compression.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-md glow-card">
              <CheckCircle className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Signup Required</h3>
              <p className="text-slate-400 text-sm">Start removing Sora watermarks immediately. No account or registration needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-slate-900/50 py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Sora Watermark Remover FAQ
          </h2>
          <p className="text-center text-slate-400 mb-12">
            Common questions about removing watermarks from Sora AI videos
          </p>
          <div className="space-y-6">
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Is this Sora AI video generator free?</h3>
              <p className="text-slate-400">Yes! Our Sora AI video generator and watermark remover is 100% free. Download Sora AI videos without watermarks - no hidden costs, no Sora AI price to pay.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">How to use this Sora AI text to video tool?</h3>
              <p className="text-slate-400">Copy your Sora AI video URL from sora.chatgpt.com (requires Sora AI login for source), paste it here, and download your watermark-free video instantly.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">What is the quality of downloaded Sora videos?</h3>
              <p className="text-slate-400">All Sora AI videos are downloaded in their original HD quality without any compression or quality loss during watermark removal.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">How long does Sora watermark removal take?</h3>
              <p className="text-slate-400">Our Sora video downloader processes and removes watermarks in just 5-10 seconds, making it the fastest tool available.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Do I need to sign up to use this Sora tool?</h3>
              <p className="text-slate-400">No signup required! Start removing Sora watermarks and downloading videos immediately without creating an account.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Are my Sora videos stored on your servers?</h3>
              <p className="text-slate-400">No. We process Sora AI videos in real-time and never store any content on our servers. Your privacy is guaranteed.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Can I use this with OpenAI Sora and open Sora AI?</h3>
              <p className="text-slate-400">Yes! Works with OpenAI Sora (open ai sora) from sora.chatgpt.com. Compatible with all Sora AI video generation outputs.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">What are the best Sora AI alternatives?</h3>
              <p className="text-slate-400">While there are Sora AI alternatives, our tool works directly with original Sora AI video maker content, giving you the best quality without compromise.</p>
            </div>
            <div className="pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Why is this the best AI video generator Sora tool?</h3>
              <p className="text-slate-400">Instant Sora AI video generation processing, HD quality, complete watermark removal, free forever - the ultimate Sora AI application for creators.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="bg-slate-950 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">
              About Sora AI Video Generator
            </h2>
            <div className="space-y-6 text-slate-400">
              <p>
                <strong className="text-white">Sora AI</strong> is OpenAI's revolutionary text to video AI technology that creates stunning videos from text prompts. Our free Sora AI video generator tool allows you to download these Sora AI videos without watermarks in full HD quality.
              </p>
              <p>
                Whether you're looking for a <strong className="text-white">Sora AI video maker</strong>, <strong className="text-white">Sora AI generator</strong>, or need to remove watermarks from your Sora AI video generation projects, our tool provides instant, free access without requiring a Sora AI login on our platform.
              </p>
              <p>
                Unlike other <strong className="text-white">Sora AI alternatives</strong>, we work directly with OpenAI Sora (open ai sora) content from sora.chatgpt.com, ensuring the highest quality output. Our <strong className="text-white">AI video generator Sora</strong> tool is completely free - no Sora AI price, no hidden fees, just instant watermark-free downloads.
              </p>
              <p>
                For creators seeking a reliable <strong className="text-white">Sora AI video creator</strong> and <strong className="text-white">Sora video generator AI</strong> solution, our platform offers the fastest processing times and maintains original HD quality throughout the entire watermark removal process.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Upload className="w-6 h-6 text-cyan-400" />
              <span className="text-xl font-bold">Unmarkly</span>
            </div>
            <p className="text-slate-400 mb-4">
              Unmarkly - Free Sora AI video watermark remover and video downloader. The best tool for downloading OpenAI Sora videos in HD quality without watermarks.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-500 mb-4">
              <span>Sora AI Video Maker</span>
              <span>•</span>
              <span>Sora AI Text to Video</span>
              <span>•</span>
              <span>AI Video Generator Sora</span>
              <span>•</span>
              <span>Open AI Sora</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm mb-6">
              <a href="/about.html" className="text-slate-400 hover:text-cyan-400 transition-colors">About</a>
              <a href="/contact.html" className="text-slate-400 hover:text-cyan-400 transition-colors">Contact</a>
              <a href="/privacy-policy.html" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <a href="/terms-of-service.html" className="text-slate-400 hover:text-cyan-400 transition-colors">Terms of Service</a>
            </div>
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} Unmarkly. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .glow-text {
          text-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
        }

        .glow-card {
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.1);
        }

        .glow-card:hover {
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.15);
        }

        .glow-card-strong {
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.2), inset 0 0 20px rgba(34, 211, 238, 0.05);
        }

        .glow-button {
          box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
        }

        .glow-button:hover {
          box-shadow: 0 0 30px rgba(34, 211, 238, 0.5);
        }

        .glow-progress {
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.6), inset 0 0 10px rgba(34, 211, 238, 0.4);
        }

        .glow-badge {
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.4);
        }

        .glow-icon {
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.2);
        }
      `}</style>
    </div>
  );
}

export default App;
