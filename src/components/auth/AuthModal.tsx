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
  KeyRound,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Smartphone,
  RefreshCw,
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
    verify2FALogin,
    requestPasswordReset,
    verifyPasswordReset,
    confirmEmailVerification,
    sendEmailVerification,
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

  // Email Verification fields
  const [emailVerifyCode, setEmailVerifyCode] = useState('');
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
