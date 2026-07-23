import { Sparkles, Wrench, Clock, ArrowRight, Heart, MessageCircle } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/unmarkly-logo-new.png" alt="Unmarkly" className="w-10 h-10 object-contain" />
              <h1 className="text-2xl font-bold text-white">Unmarkly</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#what-happened" className="text-slate-400 hover:text-cyan-400 transition-colors">What Happened</a>
              <a href="#whats-next" className="text-slate-400 hover:text-cyan-400 transition-colors">What's Next</a>
              <a href="#faq" className="text-slate-400 hover:text-cyan-400 transition-colors">FAQ</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Announcement Banner */}
      <div className="bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-cyan-600/20 border-b border-cyan-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-center space-x-3 text-center">
            <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <p className="text-sm text-slate-200">
              <span className="font-semibold text-cyan-400">Service Update:</span>{' '}
              Sora has been discontinued by OpenAI. Our watermark removal tool has been retired.
            </p>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Sora Has Been
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mt-2 glow-text">Discontinued</span>
          </h1>
          <p className="text-xl text-slate-400 mb-4 max-w-2xl mx-auto">
            OpenAI has officially discontinued Sora, and as a result, our Sora watermark removal service is no longer available. Thank you to everyone who used and supported Unmarkly.
          </p>

          {/* Status Badge */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <div className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2 glow-card">
              <span className="w-3 h-3 bg-amber-400 rounded-full animate-pulse"></span>
              <span className="text-slate-200 font-medium">Service Discontinued</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2 glow-card">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-200 font-medium">New Tools Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Notice + Teaser Block */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-8 glow-card text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center glow-icon">
                <Heart className="w-8 h-8 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Thank You for Your Support</h3>
            <p className="text-slate-400 leading-relaxed mb-6">
              We're grateful to the thousands of creators who trusted Unmarkly to remove watermarks from their Sora AI videos. Unfortunately, with OpenAI's decision to discontinue Sora, this tool is no longer operational.
            </p>
            <p className="text-slate-400 leading-relaxed">
              But this isn't the end of Unmarkly. We're building something new.
            </p>
          </div>

          {/* Coming Soon Teaser */}
          <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 backdrop-blur-sm border-2 border-cyan-500/30 rounded-2xl shadow-2xl p-8 text-center glow-card-strong animate-fadeIn">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center glow-icon">
                <Wrench className="w-10 h-10 text-cyan-400" />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">More Tools Coming Soon</h3>
            <p className="text-lg text-slate-300 mb-2">
              We're working on a brand new suite of creative tools.
            </p>
            <p className="text-slate-400 mb-8">
              Stay tuned — something exciting is on the way.
            </p>
            <a
              href="#whats-next"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 glow-button"
            >
              <span>See What's Next</span>
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* What Happened Section */}
      <section id="what-happened" className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            What Happened to Sora?
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            A brief explanation of why the service was retired
          </p>
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 glow-card space-y-6 text-slate-400 leading-relaxed">
            <p>
              OpenAI has officially discontinued Sora, its AI text-to-video platform. As a result, Sora video URLs are no longer accessible, and our watermark removal service can no longer process videos.
            </p>
            <p>
              We built Unmarkly to help creators download clean, watermark-free Sora videos, and we're proud to have served the community during Sora's run. With the platform now retired, we've made the decision to sunset this tool.
            </p>
            <p>
              If you have questions about the shutdown or previously downloaded content, please check the FAQ below or reach out via our contact page.
            </p>
          </div>
        </div>
      </section>

      {/* What's Next Section */}
      <section id="whats-next" className="bg-slate-900/50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            What's Next for Unmarkly
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            We're not going away. New tools are on the horizon.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-md glow-card text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 glow-icon">
                <Sparkles className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">New Creative Tools</h3>
              <p className="text-slate-400 text-sm">A fresh suite of tools for creators is in the works. Built from the ground up with the same care you came to expect from Unmarkly.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-md glow-card text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 glow-icon">
                <Clock className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Coming Soon</h3>
              <p className="text-slate-400 text-sm">We're in active development. Stay tuned for announcements as we get closer to launching our next generation of tools.</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-md glow-card text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 glow-icon">
                <Heart className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Built for You</h3>
              <p className="text-slate-400 text-sm">Our community has always been at the heart of what we build. The next chapter of Unmarkly is no different — designed with creators in mind.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-slate-900/50 py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-slate-400 mb-12">
            Common questions about the Sora discontinuation and what's next
          </p>
          <div className="space-y-6">
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Why is the Sora watermark remover no longer working?</h3>
              <p className="text-slate-400">OpenAI has discontinued Sora, its AI text-to-video platform. Since Sora video URLs are no longer accessible, our tool can no longer process or remove watermarks from those videos.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Can I still download videos I previously processed?</h3>
              <p className="text-slate-400">Any videos you already downloaded before the shutdown are yours to keep. However, we no longer process new requests, and previously generated download links are no longer active.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Is Unmarkly shutting down completely?</h3>
              <p className="text-slate-400">No. The Sora watermark removal tool has been retired, but Unmarkly is not going away. We're actively building a new suite of creative tools and will share more details soon.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">When will the new tools be available?</h3>
              <p className="text-slate-400">We're in active development and will announce more details as we get closer to launch. Stay tuned — follow our updates or check back here for the latest news.</p>
            </div>
            <div className="border-b border-slate-700 pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">How can I stay updated on what's coming next?</h3>
              <p className="text-slate-400">Keep an eye on this page for announcements. You can also reach out through our contact page if you'd like to get in touch directly.</p>
            </div>
            <div className="pb-6">
              <h3 className="text-lg font-semibold text-white mb-2">I have a question that isn't answered here. What should I do?</h3>
              <p className="text-slate-400">We're happy to help. Visit our <a href="/contact.html" className="text-cyan-400 hover:text-cyan-300 transition-colors">contact page</a> and send us a message — we'll get back to you as soon as we can.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Thank You Section */}
      <section className="bg-slate-950 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Thank You for Being Part of the Journey
          </h2>
          <div className="space-y-6 text-slate-400">
            <p>
              To every creator who used Unmarkly — thank you. Your support and feedback helped us build something we were genuinely proud of. While the Sora chapter has come to a close, the Unmarkly story is far from over.
            </p>
            <p>
              We're already hard at work on what comes next. New tools, new features, and new ways to help you create. We can't wait to share them with you.
            </p>
            <p className="text-lg text-slate-300 font-medium">
              Stay tuned. The best is yet to come.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img src="/unmarkly-logo-new.png" alt="Unmarkly" className="w-8 h-8 object-contain" />
              <span className="text-xl font-bold">Unmarkly</span>
            </div>
            <p className="text-slate-400 mb-4">
              The Sora watermark removal service has been discontinued. New creative tools are coming soon — stay tuned.
            </p>
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

        .glow-icon {
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.2);
        }
      `}</style>
    </div>
  );
}

export default App;
