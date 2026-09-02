import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Camera,
  Loader2,
  CheckCircle,
  AlertCircle,
  LogIn,
  UserPlus,
  Fingerprint,
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Smartphone,
  Globe,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'forgot_password' | 'verify_email' | '2fa_challenge' | 'passkey';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const {
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signInWithPasskey,
    verify2FALogin,
    requestPasswordReset,
    verifyPasswordReset,
    confirmEmailVerification,
    sendEmailVerification,
    availableProfiles,
    switchProfile,
    currentUser,
    authModalMode,
    setAuthModalMode,
    suspiciousAlert,
    resolveSuspiciousAlert,
  } = useApp();

  const [mode, setMode] = useState<
    'signin' | 'signup' | 'forgot_password' | 'verify_email' | '2fa_challenge' | 'passkey'
  >(initialMode || authModalMode || 'signin');

  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
  }, [authModalMode]);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign in fields
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // 2FA Challenge fields
  const [twoFaTempToken, setTwoFaTempToken] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [twoFaBackupCode, setTwoFaBackupCode] = useState('');

  // Forgot Password fields
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotResetCode, setForgotResetCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [demoResetCode, setDemoResetCode] = useState('');

  // Email Verification fields
  const [emailVerifyCode, setEmailVerifyCode] = useState('');
  const [demoVerifyCode, setDemoVerifyCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sign up fields
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpBio, setSignUpBio] = useState('');
  const [signUpAvatar, setSignUpAvatar] = useState<string>('');

  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  if (!isOpen) return null;

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

  // Sign In Handler
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!signInIdentifier.trim() || !signInPassword) {
      setErrorMessage('Please enter your username/email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(signInIdentifier.trim(), signInPassword, rememberMe);
      if (res.requires2Fa && res.tempToken) {
        setTwoFaTempToken(res.tempToken);
        setMode('2fa_challenge');
        setSuccessMessage('Please enter your Two-Factor Authentication code.');
        return;
      }

      if (res.success && res.user) {
        setSuccessMessage(`Welcome back, @${res.user.username}!`);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.error || 'Failed to sign in. Please verify your credentials.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // 2FA Verification Handler
  const handle2FAChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const codeToVerify = useBackupCode ? twoFaBackupCode.trim() : twoFaCode.trim();
    if (!codeToVerify) {
      setErrorMessage(useBackupCode ? 'Please enter a backup recovery code' : 'Please enter the 6-digit authenticator code');
      return;
    }

    setLoading(true);
    try {
      const res = await verify2FALogin(twoFaTempToken, codeToVerify, useBackupCode, rememberMe);
      if (res.success && res.user) {
        setSuccessMessage(`Verified! Welcome back, @${res.user.username}.`);
        setTimeout(() => {
          onClose();
        }, 600);
      } else {
        setErrorMessage(res.error || 'Invalid 2FA code. Please check and retry.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || '2FA verification error.');
    } finally {
      setLoading(false);
    }
  };

  // Sign Up Handler
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanUsername = signUpUsername.trim().toLowerCase().replace(/[^a-z0-9._]/g, '');
    if (cleanUsername.length < 3) {
      setErrorMessage('Username must be at least 3 characters (letters, numbers, underscores).');
      return;
    }

    if (!signUpName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await signUp(
        {
          username: cleanUsername,
          name: signUpName.trim(),
          email: signUpEmail.trim() || undefined,
          password: signUpPassword,
          bio: signUpBio.trim(),
          avatar: signUpAvatar || undefined,
        },
        rememberMe
      );

      if (res.success && res.user) {
        if (res.emailVerificationCode) {
          setDemoVerifyCode(res.emailVerificationCode);
          setSuccessMessage('Account created! Please verify your email.');
          setMode('verify_email');
        } else {
          setSuccessMessage('Account created successfully! Welcome to InstaVibe.');
          setTimeout(() => {
            onClose();
          }, 800);
        }
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      // Authenticate with Google identity simulation
      const res = await signInWithGoogle(
        {
          email: 'alex.rivera@gmail.com',
          name: 'Alex Rivera',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          googleId: 'g_' + Math.random().toString(36).substring(2, 10),
        },
        rememberMe
      );

      if (res.success && res.user) {
        setSuccessMessage(`Signed in with Google as @${res.user.username}`);
        setTimeout(() => onClose(), 600);
      } else {
        setErrorMessage(res.error || 'Google sign-in failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Google authentication error');
    } finally {
      setLoading(false);
    }
  };

  // Apple OAuth Login
  const handleAppleLogin = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await signInWithApple(
        {
          email: 'user.apple@icloud.com',
          name: 'Apple User',
          appleUserId: 'apple_' + Math.random().toString(36).substring(2, 10),
        },
        rememberMe
      );

      if (res.success && res.user) {
        setSuccessMessage(`Signed in with Apple ID`);
        setTimeout(() => onClose(), 600);
      } else {
        setErrorMessage(res.error || 'Apple sign-in failed');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Apple sign-in error');
    } finally {
      setLoading(false);
    }
  };

  // Passkey Login
  const handlePasskeyLogin = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await signInWithPasskey(rememberMe);
      if (res.success && res.user) {
        setSuccessMessage(`Passkey verified! Welcome @${res.user.username}`);
        setTimeout(() => onClose(), 600);
      } else {
        setErrorMessage(res.error || 'No registered passkey found on this device.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Passkey verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Request
  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await requestPasswordReset(forgotIdentifier.trim());
      if (res.success) {
        setSuccessMessage(res.message || 'Reset code sent to your registered email.');
        if (res.debugCode) {
          setDemoResetCode(res.debugCode);
          setForgotResetCode(res.debugCode);
        }
        setForgotStep('verify');
      } else {
        setErrorMessage(res.error || 'User not found.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Verification & Reset
  const handleForgotPasswordVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotResetCode.trim() || forgotNewPassword.length < 6) {
      setErrorMessage('Please enter the 6-digit code and a new password of at least 6 characters.');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await verifyPasswordReset(forgotIdentifier.trim(), forgotResetCode.trim(), forgotNewPassword);
      if (res.success) {
        setSuccessMessage('Password reset successfully! Please sign in with your new password.');
        setTimeout(() => {
          setMode('signin');
          setForgotStep('request');
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Invalid or expired code.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // Email Verification Confirm
  const handleEmailVerificationConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailVerifyCode.trim()) {
      setErrorMessage('Please enter the 6-digit confirmation code');
      return;
    }
    setErrorMessage('');
    setLoading(true);
    try {
      const res = await confirmEmailVerification(emailVerifyCode.trim());
      if (res.success) {
        setSuccessMessage('Email verified successfully! Enjoy InstaVibe.');
        setTimeout(() => onClose(), 800);
      } else {
        setErrorMessage(res.error || 'Invalid verification code');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmailCode = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const res = await sendEmailVerification();
      if (res.success) {
        setSuccessMessage('A new verification code has been dispatched.');
        if (res.debugCode) {
          setDemoVerifyCode(res.debugCode);
          setEmailVerifyCode(res.debugCode);
        }
        setResendCooldown(60);
      } else {
        setErrorMessage(res.error || 'Failed to resend code');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error resending code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={onClose} />

      <input
        type="file"
        ref={avatarInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) handleAvatarFile(e.target.files[0]);
        }}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Suspicious Login Warning Banner if triggered */}
        {suspiciousAlert && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 p-3.5 flex items-start gap-3">
            <ShieldAlert className="text-amber-500 flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1 text-xs">
              <p className="font-bold text-amber-700 dark:text-amber-300">
                Suspicious Login Detected
              </p>
              <p className="text-neutral-600 dark:text-neutral-300 mt-0.5 text-[11px]">
                {suspiciousAlert.reason || 'Unrecognized login attempt'} ({suspiciousAlert.location || suspiciousAlert.deviceName || 'Unknown location'})
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => resolveSuspiciousAlert('confirm_me')}
                  className="px-2.5 py-1 bg-amber-500 text-white rounded-lg font-bold text-[10px] hover:bg-amber-600"
                >
                  Yes, it's me
                </button>
                <button
                  type="button"
                  onClick={() => resolveSuspiciousAlert('lock_and_secure')}
                  className="px-2.5 py-1 bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg font-bold text-[10px]"
                >
                  Lock Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            {mode !== 'signin' && mode !== 'signup' && (
              <button
                type="button"
                onClick={() => {
                  setErrorMessage('');
                  setSuccessMessage('');
                  setMode('signin');
                }}
                className="p-1 -ml-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <span className="font-serif italic font-bold text-xl tracking-tight text-neutral-900 dark:text-white">
              InstaVibe
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-full">
              Security 2.0
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Tabs (Only for Sign In & Sign Up) */}
        {(mode === 'signin' || mode === 'signup') && (
          <div className="grid grid-cols-2 p-1.5 m-4 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signin'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <UserPlus size={15} />
              <span>Create Account</span>
            </button>
          </div>
        )}

        {/* Notifications / Alerts */}
        <div className="px-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 no-scrollbar">
          {/* MODE: SIGN IN */}
          {mode === 'signin' && (
            <div className="space-y-4">
              {/* Fast Social & Biometric Logins */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center justify-center gap-1.5 transition-all text-xs font-semibold text-neutral-700 dark:text-neutral-200 shadow-sm cursor-pointer"
                  title="Sign in with Google"
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
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center justify-center gap-1.5 transition-all text-xs font-semibold text-neutral-700 dark:text-neutral-200 shadow-sm cursor-pointer"
                  title="Sign in with Apple"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.6-7.8-11.74-14.28-5.43-8.47-9.7-18.06-12.81-28.77-3.11-10.72-4.67-21.05-4.67-30.01 0-14.02 3.53-25.59 10.59-34.71 7.06-9.13 16.03-13.8 26.91-14.02 4.13 0 9.07 1.13 14.83 3.38 5.76 2.25 9.45 3.44 11.07 3.57 1.2.12 5.06-1.12 11.59-3.73 6.52-2.61 11.83-3.76 15.93-3.46 11.96.86 21.36 4.96 28.2 12.3-10.43 6.31-15.54 15.11-15.34 26.4.2 8.7 3.44 16.03 9.72 21.99 6.28 5.96 13.91 9.46 22.89 10.51-2.18 6.52-4.8 12.83-7.87 18.93zM119.22 31.84c0-7.39 2.67-14.4 8.01-21.03 5.34-6.63 12.08-10.57 20.22-11.81.44 1.3.66 2.61.66 3.91 0 7.39-2.73 14.54-8.19 21.46-5.46 6.92-12.28 10.96-20.46 12.12-.11-1.52-.24-3.07-.24-4.65z" />
                  </svg>
                  <span>Apple</span>
                </button>

                <button
                  type="button"
                  onClick={handlePasskeyLogin}
                  disabled={loading}
                  className="py-2.5 px-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-blue-50 dark:hover:bg-blue-950/30 flex items-center justify-center gap-1.5 transition-all text-xs font-semibold text-neutral-700 dark:text-neutral-200 shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-800"
                  title="Sign in with Passkey / Face ID"
                >
                  <Fingerprint size={16} className="text-blue-500" />
                  <span>Passkey</span>
                </button>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
                <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                  or email login
                </span>
                <div className="flex-1 h-[1px] bg-neutral-200 dark:bg-neutral-800" />
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                    Username or Email
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 focus-within:border-blue-500 transition-colors">
                    <UserIcon size={18} className="text-neutral-400" />
                    <input
                      type="text"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      placeholder="Enter username or email"
                      className="w-full text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                      className="text-[11px] font-semibold text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 focus-within:border-blue-500 transition-colors">
                    <Lock size={18} className="text-neutral-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-300 dark:border-neutral-700"
                    />
                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      Remember this device (30 days)
                    </span>
                  </label>
                  <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                    <ShieldCheck size={12} className="text-emerald-500" />
                    JWT Secure
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Log In</span>
                  )}
                </button>
              </form>

              {/* Fast switch list if accounts exist */}
              {availableProfiles.length > 0 && (
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2.5">
                    Saved accounts on this device
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                    {availableProfiles.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          switchProfile(user);
                          onClose();
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${
                          currentUser.id === user.id
                            ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                        }`}
                      >
                        <img
                          src={user.avatar}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover border border-neutral-200 dark:border-neutral-700"
                        />
                        <div className="text-left flex-1 min-w-0">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-[11px] text-neutral-500 truncate">
                            @{user.username}
                          </p>
                        </div>
                        {currentUser.id === user.id && (
                          <span className="text-[10px] font-bold text-blue-500 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODE: 2FA CHALLENGE */}
          {mode === '2fa_challenge' && (
            <form onSubmit={handle2FAChallengeSubmit} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-3">
                  <ShieldCheck size={28} />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Two-Factor Authentication
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  {useBackupCode
                    ? 'Enter one of your 10-character emergency backup recovery codes.'
                    : 'Enter the 6-digit security code generated by your Authenticator App (Google Authenticator / Authy).'}
                </p>
              </div>

              {useBackupCode ? (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                    Backup Code
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 focus-within:border-blue-500">
                    <KeyRound size={18} className="text-neutral-400" />
                    <input
                      type="text"
                      value={twoFaBackupCode}
                      onChange={(e) => setTwoFaBackupCode(e.target.value.toUpperCase())}
                      placeholder="e.g. A1B2-C3D4"
                      className="w-full text-sm font-mono tracking-widest bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                    6-Digit Authenticator Code
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 focus-within:border-blue-500">
                    <KeyRound size={18} className="text-neutral-400" />
                    <input
                      type="text"
                      maxLength={6}
                      value={twoFaCode}
                      onChange={(e) => setTwoFaCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      className="w-full text-center text-lg font-mono tracking-widest bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400 font-bold"
                      required
                      autoFocus
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setUseBackupCode((prev) => !prev)}
                  className="text-xs font-semibold text-blue-500 hover:underline"
                >
                  {useBackupCode ? 'Use 6-digit Authenticator app' : 'Use emergency backup code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying 2FA...</span>
                  </>
                ) : (
                  <span>Verify and Sign In</span>
                )}
              </button>
            </form>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'forgot_password' && (
            <div className="space-y-4">
              <div className="text-center py-1">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Reset Password
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  {forgotStep === 'request'
                    ? 'Enter your username or email address and we will send a 6-digit reset code.'
                    : 'Enter the 6-digit reset code and your new password.'}
                </p>
              </div>

              {forgotStep === 'request' ? (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                      Username or Email
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 focus-within:border-blue-500">
                      <Mail size={18} className="text-neutral-400" />
                      <input
                        type="text"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="Enter your email or username"
                        className="w-full text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending reset code...</span>
                      </>
                    ) : (
                      <span>Send 6-Digit Code</span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotPasswordVerify} className="space-y-3.5">
                  {demoResetCode && (
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl text-xs flex items-center justify-between text-blue-700 dark:text-blue-300">
                      <span>Demo Reset Code: <strong>{demoResetCode}</strong></span>
                      <button
                        type="button"
                        onClick={() => setForgotResetCode(demoResetCode)}
                        className="text-[11px] font-bold underline"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                      6-Digit Reset Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotResetCode}
                      onChange={(e) => setForgotResetCode(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="123456"
                      className="w-full text-center text-lg font-mono tracking-widest p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                      New Password
                    </label>
                    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 focus-within:border-blue-500">
                      <Lock size={18} className="text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Updating password...</span>
                      </>
                    ) : (
                      <span>Reset Password & Sign In</span>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* MODE: EMAIL VERIFICATION */}
          {mode === 'verify_email' && (
            <form onSubmit={handleEmailVerificationConfirm} className="space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-3">
                  <Mail size={28} />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  Verify Your Email Address
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  We've sent a 6-digit confirmation code to your inbox to protect your account.
                </p>
              </div>

              {demoVerifyCode && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs flex items-center justify-between text-emerald-700 dark:text-emerald-300">
                  <span>Verification Code: <strong>{demoVerifyCode}</strong></span>
                  <button
                    type="button"
                    onClick={() => setEmailVerifyCode(demoVerifyCode)}
                    className="text-[11px] font-bold underline"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={emailVerifyCode}
                  onChange={(e) => setEmailVerifyCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full text-center text-xl font-mono tracking-widest p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 text-neutral-900 dark:text-white font-bold outline-none focus:border-emerald-500"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendEmailCode}
                  disabled={resendCooldown > 0 || loading}
                  className="font-semibold text-blue-500 hover:underline disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Confirm Verification</span>
                )}
              </button>
            </form>
          )}

          {/* MODE: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-center bg-neutral-50 dark:bg-neutral-800">
                    {signUpAvatar ? (
                      <img
                        src={signUpAvatar}
                        alt="Avatar preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon size={32} className="text-neutral-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 bg-blue-500 text-white rounded-full ring-2 ring-white dark:ring-neutral-900 shadow-md hover:bg-blue-600 transition-transform active:scale-95"
                    title="Upload Photo"
                  >
                    <Camera size={14} />
                  </button>
                </div>
                <span className="text-[11px] text-neutral-500 mt-1.5 font-medium">
                  {signUpAvatar ? 'Profile photo added' : 'Add profile photo (optional)'}
                </span>
              </div>

              {/* Username */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Username *
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 focus-within:border-blue-500">
                  <span className="text-sm font-bold text-neutral-400">@</span>
                  <input
                    type="text"
                    value={signUpUsername}
                    onChange={(e) =>
                      setSignUpUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))
                    }
                    placeholder="your.username"
                    className="w-full text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                    required
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Full Name *
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 focus-within:border-blue-500">
                  <UserIcon size={16} className="text-neutral-400" />
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Email (for verification & recovery)
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 focus-within:border-blue-500">
                  <Mail size={16} className="text-neutral-400" />
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Password *
                </label>
                <div className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 focus-within:border-blue-500">
                  <Lock size={16} className="text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full text-sm bg-transparent outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                  Bio (optional)
                </label>
                <textarea
                  value={signUpBio}
                  onChange={(e) => setSignUpBio(e.target.value)}
                  placeholder="Share a few words about yourself..."
                  rows={2}
                  className="w-full p-2.5 text-sm bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700 outline-none text-neutral-900 dark:text-white placeholder-neutral-400 resize-none"
                />
              </div>

              {/* Remember Me on Signup */}
              <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-300 dark:border-neutral-700"
                />
                <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                  Remember this device (auto-renew JWT session)
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-amber-500 hover:opacity-95 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating real account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
