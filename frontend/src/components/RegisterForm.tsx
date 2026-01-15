import { useState } from 'react';
import { authService, RegisterCredentials } from '../services/authService';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
  onError: (error: string) => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin, onError }: RegisterFormProps) {
  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    onError(''); // Clear previous errors

    // Validate passwords match
    if (credentials.password !== confirmPassword) {
      onError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (credentials.password.length < 8) {
      onError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (!/[A-Z]/.test(credentials.password)) {
      onError('Password must contain at least one uppercase letter');
      setIsLoading(false);
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(credentials.password)) {
      onError('Password must contain at least one special character');
      setIsLoading(false);
      return;
    }

    try {
      await authService.register(credentials);
      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    onError(''); // Clear previous errors

    try {
      const authUrl = await authService.getGoogleAuthUrl();
      // Open Google OAuth in the same window
      window.location.href = authUrl;
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Google signup failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          Create account
        </h2>
        <p className="text-slate-400">Start building better habits</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all placeholder-slate-500 text-white"
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all placeholder-slate-500 text-white"
            placeholder="Create a strong password"
            disabled={isLoading}
          />
          <p className="mt-2 text-xs text-slate-500">
            8+ characters with uppercase and special character
          </p>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all placeholder-slate-500 text-white"
            placeholder="Confirm your password"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-white text-slate-950 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-200 mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={credentials.email}
            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 hover:border-purple-500/50 text-white"
            placeholder="you@example.com"
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={credentials.password}
            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 hover:border-purple-500/50 text-white"
            placeholder="Create a strong password"
            disabled={isLoading}
          />
          <div className="mt-2 flex items-start gap-2 text-xs text-gray-400">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>8+ characters with uppercase letter and special character</span>
          </div>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-200 mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 backdrop-blur-sm border-2 border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 placeholder-gray-500 hover:border-purple-500/50 text-white"
            placeholder="Confirm your password"
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </span>
          ) : (
            'Create Account'
          )}
        </button>
      </form>
      
      
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-slate-950 text-slate-500">Or</span>
          </div>
        </div>
        
        <button
          onClick={handleGoogleSignup}
          disabled={isLoading}
          className="mt-6 w-full flex items-center justify-center gap-3 px-4 py-3 border border-white/10 rounded-lg text-sm font-medium text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-slate-400">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-white hover:text-slate-300 font-medium transition-colors"
            disabled={isLoading}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
