import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  Lock, 
  User, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  LogIn, 
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { loginWithGoogle, loginWithEmail, signUpWithEmail } from '../lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { MxLogo } from './MxLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: (user: FirebaseUser) => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const formatAuthError = (err?: string | null): string => {
    if (!err) return 'Authentication request failed. Please try again.';
    const lower = err.toLowerCase();
    if (lower.includes('api-key-not-valid') || lower.includes('api key not valid')) {
      return 'Firebase API key error. The API key in environment variables may have trailing commas/quotes, or needs domain allowlisting.';
    }
    if (lower.includes('unauthorized-domain')) {
      return 'This domain is not authorized in Firebase. Please add your domain to Firebase Console > Authentication > Settings > Authorized domains.';
    }
    if (lower.includes('popup-blocked') || lower.includes('popup-closed-by-user')) {
      return 'The Google sign-in window was closed or blocked. If you are previewing in an iframe, please allow popups or use email sign-in below.';
    }
    if (lower.includes('user-not-found') || lower.includes('wrong-password') || lower.includes('invalid-credential') || lower.includes('invalid_login_credentials')) {
      return 'Invalid email or password. Please check your credentials.';
    }
    if (lower.includes('email-already-in-use')) {
      return 'An account with this email already exists. Please switch to Sign In.';
    }
    if (lower.includes('weak-password')) {
      return 'Password should be at least 6 characters.';
    }
    if (lower.includes('invalid-email')) {
      return 'Please enter a valid email address.';
    }
    return err;
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await loginWithGoogle();
    setIsLoading(false);

    if (result.success && result.user) {
      setSuccessMessage(`Welcome back, ${result.user.displayName || result.user.email}!`);
      if (onAuthSuccess) onAuthSuccess(result.user);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMessage(formatAuthError(result.error));
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Please enter your full name.');
        setIsLoading(false);
        return;
      }
      const res = await signUpWithEmail(name, email, password);
      setIsLoading(false);
      if (res.success && res.user) {
        setSuccessMessage(`Account created successfully! Welcome, ${name}.`);
        if (onAuthSuccess) onAuthSuccess(res.user);
        setTimeout(() => onClose(), 1000);
      } else {
        setErrorMessage(formatAuthError(res.error));
      }
    } else {
      const res = await loginWithEmail(email, password);
      setIsLoading(false);
      if (res.success && res.user) {
        setSuccessMessage(`Signed in successfully! Welcome back.`);
        if (onAuthSuccess) onAuthSuccess(res.user);
        setTimeout(() => onClose(), 1000);
      } else {
        setErrorMessage(formatAuthError(res.error));
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative animate-in zoom-in-95 border border-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          id="auth-modal-close-btn"
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="mb-3">
            <MxLogo size="lg" showText={false} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {mode === 'signup' ? 'Create MX Gallery Account' : 'Sign in to MX Gallery'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your creator studio, saved designs, bank payouts & orders
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signin' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signup' 
                ? 'bg-white text-slate-900 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">{errorMessage}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Google Sign In/Up Button */}
        <div className="space-y-3">
          <button
            type="button"
            id="google-auth-btn"
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            {/* Authentic Google 'G' Logo SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>
              {mode === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
            </span>
          </button>

          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider absolute">
              or continue with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-[0.99] disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'signup' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security & Disclaimer Footer */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secured by Firebase Auth & Google</span>
          </div>
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-rose-600 hover:underline font-bold"
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};
