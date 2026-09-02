import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  Mail,
  User as UserIcon,
  Sparkles,
  Fingerprint,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuthPage: React.FC = () => {
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signInWithPasskey,
    verify2FALogin,
    requestPasswordReset,
    verifyPasswordReset,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot_password' | '2fa_challenge'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Phone slideshow animation index
  const [activeSlide, setActiveSlide] = useState(0);
  const mockupSlides = [
    {
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      caption: 'Explore trending photography, art & aesthetic reels ✨',
      user: '@aesthetic_vibes',
    },
    {
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop&q=80',
      caption: 'Connect with friends in real-time with instant direct chat 💬',
      user: '@sarah_chen',
    },
    {
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
      caption: 'Share 24-hour stories, high-res photos & video highlights 📸',
      user: '@elena_vibe',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % mockupSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Sign In fields
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up fields
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpBio, setSignUpBio] = useState('');
  const [signUpAvatar, setSignUpAvatar] = useState<string>('');
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // 2FA Challenge
  const [twoFaTempToken, setTwoFaTempToken] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [twoFaBackupCode, setTwoFaBackupCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);

  // Forgot Password
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotResetCode, setForgotResetCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  const clearMessages = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleAvatarFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSignUpAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!signInIdentifier.trim()) {
      setErrorMessage('Please enter your username, email, or phone');
      return;
    }
    if (!signInPassword) {
      setErrorMessage('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(signInIdentifier.trim(), signInPassword, rememberMe);
      if (res.requires2Fa && res.tempToken) {
        setTwoFaTempToken(res.tempToken);
        setMode('2fa_challenge');
        setSuccessMessage('Please enter your 2-Factor Authentication code');
      } else if (!res.success) {
        setErrorMessage(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!signUpUsername.trim()) {
      setErrorMessage('Please enter a unique username');
      return;
    }
    if (!signUpName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!signUpPassword || signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const res = await signUp(
        {
          username: signUpUsername.trim().toLowerCase().replace(/\s+/g, '_'),
          name: signUpName.trim(),
          email: signUpEmail.trim() || undefined,
          password: signUpPassword,
          bio: signUpBio.trim(),
          avatar: signUpAvatar || undefined,
        },
        rememberMe
      );

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create account');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    const code = useBackupCode ? twoFaBackupCode.trim() : twoFaCode.trim();
    if (!code) {
      setErrorMessage(useBackupCode ? 'Please enter a backup code' : 'Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await verify2FALogin(twoFaTempToken, code, useBackupCode, rememberMe);
      if (!res.success) {
        setErrorMessage(res.error || 'Invalid authentication code');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!forgotIdentifier.trim()) {
      setErrorMessage('Please enter your username or email');
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(forgotIdentifier.trim());
      if (res.success) {
        setForgotStep('verify');
        setSuccessMessage(res.message || 'Verification code sent! Please check your email or SMS.');
        if (res.debugCode) {
          setForgotResetCode(res.debugCode);
        }
      } else {
        setErrorMessage(res.error || 'Could not locate account');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!forgotResetCode.trim()) {
      setErrorMessage('Please enter the 6-digit verification code');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyPasswordReset(forgotIdentifier.trim(), forgotResetCode.trim(), forgotNewPassword);
      if (res.success) {
        setSuccessMessage('Password reset successfully! You can now log in.');
        setTimeout(() => {
          setMode('signin');
          setSignInIdentifier(forgotIdentifier);
          setSignInPassword(forgotNewPassword);
          setForgotStep('request');
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to reset password');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeySignIn = async () => {
    clearMessages();
    setLoading(true);
    try {
      const res = await signInWithPasskey(rememberMe);
      if (!res.success) {
        setErrorMessage(res.error || 'Passkey authentication was cancelled or failed.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Passkey error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    clearMessages();
    setLoading(true);
    try {
      const res = await signInWithGoogle(
        {
          email: 'demo.explorer@instavibe.internal',
          name: 'Demo Explorer',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          googleId: 'demo_google_id_001',
        },
        true
      );
      if (!res.success) {
        // Fallback to regular sign up if demo profile is not in DB
        await signUp({
          username: `demo_${Math.random().toString(36).substring(2, 6)}`,
          name: 'Demo Explorer',
          password: 'Password123!',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
          bio: 'Exploring InstaVibe ✨ Live photography, reels & real-time messaging.',
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearMessages();
    setLoading(true);
    try {
      const randomId = Math.random().toString(36).substring(2, 7);
      const res = await signInWithGoogle(
        {
          email: `google.user_${randomId}@gmail.com`,
          name: 'Google User',
          avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80`,
          googleId: `google_${randomId}`,
        },
        rememberMe
      );
      if (!res.success) setErrorMessage(res.error || 'Google sign in failed');
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col justify-between selection:bg-pink-500 selection:text-white">
      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl flex items-center justify-center gap-10">
          {/* Desktop Phone Mockup Showcase (Left Side) */}
          <div className="hidden lg:block relative w-[380px] h-[580px] flex-shrink-0">
            {/* Outer Phone Frame */}
            <div className="absolute inset-0 bg-neutral-900 rounded-[44px] p-3 shadow-2xl border-4 border-neutral-800 dark:border-neutral-700">
              {/* Phone Speaker & Dynamic Island */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-neutral-800 mr-2" />
                <div className="w-2 h-2 rounded-full bg-neutral-900" />
              </div>

              {/* Inner Screen */}
              <div className="w-full h-full rounded-[34px] overflow-hidden relative bg-neutral-900 flex flex-col">
                {/* Slideshow background */}
                {mockupSlides.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      activeSlide === index ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    <img
                      src={slide.image}
                      alt="InstaVibe Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 text-white">
                      <p className="text-xs font-semibold uppercase tracking-wider text-pink-400 mb-1">
                        {slide.user}
                      </p>
                      <p className="text-sm font-medium leading-snug drop-shadow-md">
                        {slide.caption}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Slideshow Dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
                  {mockupSlides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeSlide === i ? 'w-5 bg-white' : 'w-1.5 bg-white/50'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Instagram Auth Cards */}
          <div className="w-full max-w-[360px] flex flex-col gap-3">
            {/* Primary Card */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm sm:rounded-md px-8 py-8 shadow-sm">
              {/* Brand Logo */}
              <div className="flex flex-col items-center mb-6">
                <h1 className="text-4xl font-serif tracking-tight font-extrabold bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 bg-clip-text text-transparent select-none cursor-pointer">
                  InstaVibe
                </h1>
                {mode === 'signup' && (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center text-sm font-semibold mt-3 leading-snug">
                    Sign up to see photos and videos from your friends.
                  </p>
                )}
                {mode === 'forgot_password' && (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center text-xs mt-2">
                    Enter your username or email to recover your account.
                  </p>
                )}
                {mode === '2fa_challenge' && (
                  <p className="text-neutral-500 dark:text-neutral-400 text-center text-xs mt-2">
                    Two-factor authentication required for this account.
                  </p>
                )}
              </div>

              {/* Alert Messages */}
              {errorMessage && (
                <div
                  id="auth-error-alert"
                  className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded text-xs text-red-600 dark:text-red-400 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div
                  id="auth-success-alert"
                  className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2"
                >
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{successMessage}</span>
                </div>
              )}

              {/* 1. SIGN IN FORM */}
              {mode === 'signin' && (
                <form onSubmit={handleSignIn} className="flex flex-col gap-2.5">
                  <div>
                    <input
                      id="signin-identifier-input"
                      type="text"
                      placeholder="Phone number, username, or email"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      disabled={loading}
                      autoComplete="username"
                      required
                      className="w-full px-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="relative">
                    <input
                      id="signin-password-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="current-password"
                      required
                      className="w-full px-3 py-2.5 pr-9 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-xs font-semibold focus:outline-none"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-neutral-300 dark:border-neutral-700 text-pink-600 focus:ring-0 w-3.5 h-3.5"
                      />
                      <span>Save login info</span>
                    </label>
                  </div>

                  <button
                    id="signin-submit-btn"
                    type="submit"
                    disabled={loading || !signInIdentifier || !signInPassword}
                    className="w-full mt-2 py-2 px-4 rounded bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In'}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center my-3 gap-3">
                    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                    <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                      OR
                    </span>
                    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                  </div>

                  {/* Fast SSO / Google Login */}
                  <button
                    id="signin-google-btn"
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-1.5 flex items-center justify-center gap-2 text-xs font-semibold text-[#385185] dark:text-sky-400 hover:opacity-80 transition-opacity"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    Log in with Google
                  </button>

                  {/* Passkey Login */}
                  <button
                    id="signin-passkey-btn"
                    type="button"
                    onClick={handlePasskeySignIn}
                    disabled={loading}
                    className="w-full py-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    <Fingerprint className="w-3.5 h-3.5 text-pink-500" />
                    Log in with Passkey / Face ID
                  </button>

                  {/* 1-Click Instant Demo Button */}
                  <button
                    id="signin-demo-btn"
                    type="button"
                    onClick={handleQuickDemoLogin}
                    disabled={loading}
                    className="w-full mt-1 py-1.5 px-3 rounded border border-pink-500/30 bg-pink-50/60 dark:bg-pink-950/30 hover:bg-pink-100/70 dark:hover:bg-pink-900/40 text-pink-600 dark:text-pink-400 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                    Instant Demo Access (1-Click)
                  </button>

                  {/* Forgot Password */}
                  <div className="text-center mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setMode('forgot_password');
                        setForgotIdentifier(signInIdentifier);
                      }}
                      className="text-xs text-[#00376b] dark:text-sky-300 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </form>
              )}

              {/* 2. SIGN UP FORM */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUp} className="flex flex-col gap-2.5">
                  {/* Avatar Upload (Optional) */}
                  <div className="flex flex-col items-center mb-2">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleAvatarFile(e.target.files[0])}
                    />
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="relative w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity group overflow-hidden"
                    >
                      {signUpAvatar ? (
                        <img
                          src={signUpAvatar}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-neutral-400">
                          <Camera className="w-5 h-5" />
                          <span className="text-[9px] mt-0.5 font-medium">Photo</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-semibold">
                        Change
                      </div>
                    </div>
                  </div>

                  <div>
                    <input
                      id="signup-email-input"
                      type="email"
                      placeholder="Email address"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                      required
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                    />
                  </div>

                  <div>
                    <input
                      id="signup-name-input"
                      type="text"
                      placeholder="Full Name"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      disabled={loading}
                      autoComplete="name"
                      required
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                    />
                  </div>

                  <div>
                    <input
                      id="signup-username-input"
                      type="text"
                      placeholder="Username"
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                      disabled={loading}
                      autoComplete="username"
                      required
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                    />
                  </div>

                  <div className="relative">
                    <input
                      id="signup-password-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password (min 6 chars)"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                      required
                      className="w-full px-3 py-2 pr-9 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-xs font-semibold focus:outline-none"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  <div>
                    <input
                      id="signup-bio-input"
                      type="text"
                      placeholder="Bio (Optional)"
                      value={signUpBio}
                      onChange={(e) => setSignUpBio(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                    />
                  </div>

                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 text-center my-1 leading-snug">
                    By signing up, you agree to our{' '}
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">Terms</span>,{' '}
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">Privacy Policy</span> and{' '}
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">Cookies Policy</span>.
                  </p>

                  <button
                    id="signup-submit-btn"
                    type="submit"
                    disabled={loading || !signUpUsername || !signUpName || !signUpPassword}
                    className="w-full py-2 px-4 rounded bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign Up'}
                  </button>

                  {/* 1-Click Instant Demo Button */}
                  <button
                    id="signup-demo-btn"
                    type="button"
                    onClick={handleQuickDemoLogin}
                    disabled={loading}
                    className="w-full py-1.5 px-3 rounded border border-pink-500/30 bg-pink-50/60 dark:bg-pink-950/30 hover:bg-pink-100/70 dark:hover:bg-pink-900/40 text-pink-600 dark:text-pink-400 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-500 animate-pulse" />
                    Instant Demo Access (1-Click)
                  </button>
                </form>
              )}

              {/* 3. FORGOT PASSWORD */}
              {mode === 'forgot_password' && (
                <div>
                  {forgotStep === 'request' ? (
                    <form onSubmit={handleForgotPasswordRequest} className="flex flex-col gap-3">
                      <div className="flex justify-center mb-1">
                        <div className="w-16 h-16 rounded-full border-2 border-neutral-800 dark:border-neutral-200 flex items-center justify-center">
                          <Lock className="w-8 h-8 text-neutral-800 dark:text-neutral-200" />
                        </div>
                      </div>
                      <h3 className="text-center font-bold text-sm">Trouble logging in?</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center -mt-1 leading-snug">
                        Enter your email or username and we'll send you a 6-digit recovery code.
                      </p>

                      <input
                        type="text"
                        placeholder="Email or Username"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full px-3 py-2.5 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none focus:border-neutral-400 text-neutral-900 dark:text-neutral-100"
                      />

                      <button
                        type="submit"
                        disabled={loading || !forgotIdentifier.trim()}
                        className="w-full py-2 rounded bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Login Code'}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          clearMessages();
                          setMode('signin');
                        }}
                        className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:underline text-center mt-2"
                      >
                        Back to login
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleForgotPasswordVerify} className="flex flex-col gap-3">
                      <h3 className="text-center font-bold text-sm">Enter Recovery Code</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                        Enter the code sent to your account and choose a new password.
                      </p>

                      <input
                        type="text"
                        placeholder="6-digit code (e.g. 123456)"
                        value={forgotResetCode}
                        onChange={(e) => setForgotResetCode(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full px-3 py-2 text-xs text-center font-mono tracking-widest bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none"
                      />

                      <input
                        type="password"
                        placeholder="New Password (min 6 chars)"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        disabled={loading}
                        required
                        className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none"
                      />

                      <button
                        type="submit"
                        disabled={loading || !forgotResetCode || !forgotNewPassword}
                        className="w-full py-2 rounded bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-2"
                      >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* 4. 2FA CHALLENGE */}
              {mode === '2fa_challenge' && (
                <form onSubmit={handle2FAVerify} className="flex flex-col gap-3">
                  <div className="flex justify-center mb-1">
                    <div className="w-14 h-14 rounded-full bg-pink-100 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                  </div>
                  <h3 className="text-center font-bold text-sm">Two-Factor Authentication</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center leading-snug">
                    {useBackupCode
                      ? 'Enter one of your 8-digit emergency backup codes.'
                      : 'Enter the 6-digit code from your authenticator app.'}
                  </p>

                  {useBackupCode ? (
                    <input
                      type="text"
                      placeholder="Backup Code (e.g. 1A2B-3C4D)"
                      value={twoFaBackupCode}
                      onChange={(e) => setTwoFaBackupCode(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full px-3 py-2 text-xs text-center font-mono tracking-widest bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value)}
                      disabled={loading}
                      required
                      className="w-full px-3 py-2 text-sm text-center font-mono tracking-widest bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded focus:outline-none"
                    />
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 rounded bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Login'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setUseBackupCode(!useBackupCode)}
                    className="text-xs text-sky-500 hover:underline text-center"
                  >
                    {useBackupCode ? 'Use authenticator code instead' : 'Use a backup code instead'}
                  </button>
                </form>
              )}
            </div>

            {/* Secondary Card: Switch between Sign In / Sign Up */}
            <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm sm:rounded-md py-4 px-6 text-center text-xs shadow-sm">
              {mode === 'signin' ? (
                <p className="text-neutral-700 dark:text-neutral-300">
                  Don't have an account?{' '}
                  <button
                    id="switch-to-signup-btn"
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('signup');
                    }}
                    className="font-bold text-sky-500 hover:text-sky-600 focus:outline-none ml-1"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-neutral-700 dark:text-neutral-300">
                  Have an account?{' '}
                  <button
                    id="switch-to-signin-btn"
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('signin');
                    }}
                    className="font-bold text-sky-500 hover:text-sky-600 focus:outline-none ml-1"
                  >
                    Log in
                  </button>
                </p>
              )}
            </div>

            {/* App Store Download Badges Style */}
            <div className="flex flex-col items-center mt-2 gap-2 text-center">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Get the app.</span>
              <div className="flex items-center justify-center gap-2">
                <div className="h-9 px-3 bg-neutral-900 dark:bg-neutral-800 rounded text-white flex items-center gap-2 cursor-pointer hover:opacity-90 border border-neutral-700">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.61 1.34-.55.63-1.03 1.66-.9 2.69 1 .08 2.01-.51 2.59-1.18z" />
                  </svg>
                  <div className="text-left leading-none">
                    <div className="text-[8px] uppercase tracking-wider text-neutral-400">Download on the</div>
                    <div className="text-[11px] font-bold">App Store</div>
                  </div>
                </div>

                <div className="h-9 px-3 bg-neutral-900 dark:bg-neutral-800 rounded text-white flex items-center gap-2 cursor-pointer hover:opacity-90 border border-neutral-700">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a1.993 1.993 0 0 1-1.61-.416C1.999 21.77 2 21.6 2 21.37V2.63c0-.23.001-.4.001-.402.327-.27.876-.414 1.608-.414zm11.233 11.234l2.453-2.453-12.793-7.39 10.34 9.843zm2.453 1.898l-2.453-2.453-10.34 9.843 12.793-7.39zm1.31-1.31l3.52-2.032c1.16-.67 1.16-1.764 0-2.434l-3.52-2.032-2.454 2.454 2.454 2.454z" />
                  </svg>
                  <div className="text-left leading-none">
                    <div className="text-[8px] uppercase tracking-wider text-neutral-400">Get it on</div>
                    <div className="text-[11px] font-bold">Google Play</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer (Instagram Classic Style) */}
      <footer className="w-full py-6 px-4 text-center text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-3">
          <span className="hover:underline cursor-pointer">Meta</span>
          <span className="hover:underline cursor-pointer">About</span>
          <span className="hover:underline cursor-pointer">Blog</span>
          <span className="hover:underline cursor-pointer">Jobs</span>
          <span className="hover:underline cursor-pointer">Help</span>
          <span className="hover:underline cursor-pointer">API</span>
          <span className="hover:underline cursor-pointer">Privacy</span>
          <span className="hover:underline cursor-pointer">Terms</span>
          <span className="hover:underline cursor-pointer">Locations</span>
          <span className="hover:underline cursor-pointer">InstaVibe Lite</span>
          <span className="hover:underline cursor-pointer">Threads</span>
          <span className="hover:underline cursor-pointer">Contact Uploading & Non-Users</span>
          <span className="hover:underline cursor-pointer">Meta Verified</span>
        </div>
        <div className="flex items-center justify-center gap-4 text-[11px]">
          <select className="bg-transparent border-none focus:outline-none cursor-pointer text-neutral-500 dark:text-neutral-400">
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ja">日本語</option>
          </select>
          <span>© 2026 INSTAVIBE FROM K</span>
        </div>
      </footer>
    </div>
  );
};
