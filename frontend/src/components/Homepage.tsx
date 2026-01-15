import React from 'react';

interface HomepageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"></div>
      
      {/* Minimal grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">Discipline</span>
            </div>
            <button
              onClick={onLogin}
              className="px-4 py-2 text-sm font-medium text-white hover:text-white/80 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-24">
          <div className="max-w-3xl">
            <h1 className="text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
              Build discipline
              <br />
              through systems
            </h1>
            <p className="text-xl text-slate-400 mb-12 leading-relaxed">
              AI-powered routines and habit tracking designed for students who want to achieve more.
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={onGetStarted}
                className="px-6 py-3 bg-white text-slate-950 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
              >
                Get started
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-6 py-3 text-sm font-medium text-white hover:text-white/80 transition-colors"
              >
                Learn more →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div>
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Smart Routines</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Personalized daily schedules that adapt to your energy patterns and goals.
              </p>
            </div>

            {/* Feature 2 */}
            <div>
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Habit Tracking</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Build consistency with intelligent stacking and streak tracking.
              </p>
            </div>

            {/* Feature 3 */}
            <div>
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Progress Analytics</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Understand your patterns with detailed insights and recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to start?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Join students building better habits and achieving their goals.
            </p>
            <button
              onClick={onGetStarted}
              className="px-6 py-3 bg-white text-slate-950 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors"
            >
              Get started for free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <p className="text-sm text-slate-500">© 2026 Discipline. Built for students.</p>
        </div>
      </footer>
    </div>
  );
};
