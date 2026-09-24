import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Tablet,
  KeyRound,
  Fingerprint,
  LogOut,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Edit2,
  AlertTriangle,
  Mail,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';

export const SettingsSecurityView: React.FC = () => {
  const {
    currentUser,
    activeSessions,
    fetchSessions,
    revokeSession,
    logoutAllOtherSessions,
    trustedDevices,
    fetchTrustedDevices,
    revokeDevice,
    renameDevice,
    securityLogs,
    fetchSecurityLogs,
    setup2FA,
    enable2FA,
    disable2FA,
    registerPasskey,
    sendEmailVerification,
    openAuthModal,
    logout,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorNotice, setErrorNotice] = useState('');

  // 2FA Setup State
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFaSecret, setTwoFaSecret] = useState('');
  const [twoFaQrUrl, setTwoFaQrUrl] = useState('');
  const [twoFaBackupCodes, setTwoFaBackupCodes] = useState<string[]>([]);
  const [twoFaInputCode, setTwoFaInputCode] = useState('');

  // 2FA Disable Modal State
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  // Device Rename State
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [newDeviceName, setNewDeviceName] = useState('');

  // Initial fetch
  useEffect(() => {
    fetchSessions();
    fetchTrustedDevices();
    fetchSecurityLogs();
  }, []);

  const handleStart2FASetup = async () => {
    setLoading(true);
    setErrorNotice('');
    try {
      const res = await setup2FA();
      if (res.success && res.secret) {
        setTwoFaSecret(res.secret);
        setTwoFaQrUrl(res.qrCodeUrl || '');
        setTwoFaBackupCodes(res.backupCodes || []);
        setIsSettingUp2FA(true);
      } else {
        setErrorNotice(res.error || 'Failed to initialize 2FA setup');
      }
    } catch (e: any) {
      setErrorNotice(e.message || 'Setup error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFaInputCode.trim()) return;
    setLoading(true);
    setErrorNotice('');
    try {
      const res = await enable2FA(twoFaInputCode.trim(), twoFaSecret, twoFaBackupCodes);
      if (res.success) {
        setIsSettingUp2FA(false);
        setSuccessNotice('Two-Factor Authentication is now enabled!');
        setTimeout(() => setSuccessNotice(''), 4000);
      } else {
        setErrorNotice(res.error || 'Invalid verification code. Please try again.');
      }
    } catch (e: any) {
      setErrorNotice(e.message || 'Verification error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disablePassword) return;
    setLoading(true);
    setErrorNotice('');
    try {
      const res = await disable2FA(disablePassword);
      if (res.success) {
        setIsDisabling2FA(false);
        setDisablePassword('');
        setSuccessNotice('Two-Factor Authentication disabled.');
        setTimeout(() => setSuccessNotice(''), 4000);
      } else {
        setErrorNotice(res.error || 'Incorrect password.');
      }
    } catch (e: any) {
      setErrorNotice(e.message || 'Disable 2FA error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setLoading(true);
    setErrorNotice('');
    try {
      const res = await registerPasskey();
      if (res.success) {
        setSuccessNotice('Passkey registered successfully for this device!');
        setTimeout(() => setSuccessNotice(''), 4000);
        fetchTrustedDevices();
      } else {
        setErrorNotice(res.error || 'Could not register passkey');
      }
    } catch (e: any) {
      setErrorNotice(e.message || 'Passkey error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(twoFaSecret);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(twoFaBackupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  const handleSaveDeviceName = async (deviceId: string) => {
    if (!newDeviceName.trim()) return;
    await renameDevice(deviceId, newDeviceName.trim());
    setEditingDeviceId(null);
    setNewDeviceName('');
  };

  return (
    <div className="space-y-6 pb-6 text-neutral-900 dark:text-white">
      {/* Notices */}
      {successNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle size={16} className="flex-shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-2xl flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Email Verification Status Banner */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
            <Mail size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold">Email Verification</h4>
            <p className="text-[11px] text-neutral-500">
              {currentUser.isEmailVerified
                ? 'Your email address is verified and secured.'
                : 'Your email address is not verified yet.'}
            </p>
          </div>
        </div>
        {currentUser.isEmailVerified ? (
          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded-full">
            Verified
          </span>
        ) : (
          <button
            type="button"
            onClick={async () => {
              const res = await sendEmailVerification();
              if (res.success) {
                openAuthModal('verify_email');
              }
            }}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
          >
            Verify Now
          </button>
        )}
      </div>

      {/* 2FA Section */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold">Two-Factor Authentication (2FA)</h4>
              <p className="text-[11px] text-neutral-500">
                Protect your account with TOTP authenticator codes (Google Authenticator / Authy).
              </p>
            </div>
          </div>
          {currentUser.twoFactorEnabled ? (
            <button
              type="button"
              onClick={() => setIsDisabling2FA(true)}
              className="px-3 py-1.5 bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-200 text-xs font-bold rounded-xl transition-colors"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart2FASetup}
              disabled={loading}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              Enable 2FA
            </button>
          )}
        </div>

        {/* 2FA Setup Flow Drawer */}
        {isSettingUp2FA && (
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-4 animate-in fade-in duration-200">
            <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col items-center text-center">
              <p className="text-xs font-bold mb-2">1. Scan QR Code or Copy Secret Key</p>
              {twoFaQrUrl && (
                <div className="p-2 bg-white rounded-xl shadow-xs border border-neutral-200 mb-3">
                  <img src={twoFaQrUrl} alt="2FA QR Code" className="w-36 h-36 mx-auto" />
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl font-mono text-xs font-bold">
                <span>{twoFaSecret}</span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="p-1 hover:text-purple-500 text-neutral-400"
                  title="Copy secret"
                >
                  {copiedKey ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Backup Codes */}
            {twoFaBackupCodes.length > 0 && (
              <div className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold">2. Save Emergency Backup Codes</span>
                  <button
                    type="button"
                    onClick={handleCopyBackupCodes}
                    className="text-[11px] text-purple-600 font-bold flex items-center gap-1 hover:underline"
                  >
                    {copiedBackup ? <Check size={12} /> : <Copy size={12} />}
                    {copiedBackup ? 'Copied' : 'Copy All'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                  {twoFaBackupCodes.map((code, idx) => (
                    <div key={idx} className="p-1.5 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-center font-bold">
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confirm Code Input */}
            <form onSubmit={handleConfirm2FA} className="space-y-2">
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
                3. Enter 6-digit Authenticator Code to confirm
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={twoFaInputCode}
                  onChange={(e) => setTwoFaInputCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="flex-1 text-center font-mono tracking-widest text-base font-bold p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:border-purple-500"
                  required
                />
                <button
                  type="submit"
                  disabled={loading || twoFaInputCode.length < 6}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Confirm & Activate
                </button>
                <button
                  type="button"
                  onClick={() => setIsSettingUp2FA(false)}
                  className="px-3 py-2.5 bg-neutral-200 dark:bg-neutral-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Disable 2FA Confirmation Modal */}
        {isDisabling2FA && (
          <form
            onSubmit={handleDisable2FASubmit}
            className="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-3"
          >
            <p className="text-xs font-bold text-red-600">Enter your password to disable 2FA:</p>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              placeholder="Your current password"
              className="w-full p-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 outline-none focus:border-red-500"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || !disablePassword}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Disable
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDisabling2FA(false);
                  setDisablePassword('');
                }}
                className="px-3 py-2 bg-neutral-200 dark:bg-neutral-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Passkeys (WebAuthn / Biometrics) */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
              <Fingerprint size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold">Passkeys (Face ID & Touch ID)</h4>
              <p className="text-[11px] text-neutral-500">
                Log in instantly using biometrics or hardware security keys without passwords.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRegisterPasskey}
            disabled={loading}
            className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Fingerprint size={14} />
            <span>Add Passkey</span>
          </button>
        </div>
      </div>

      {/* Active Sessions & JWT Refresh Tokens */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold">Active Sessions ({activeSessions.length})</h4>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold rounded-full">
              JWT Rotation Active
            </span>
          </div>
          {activeSessions.length > 1 && (
            <button
              type="button"
              onClick={logoutAllOtherSessions}
              className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1"
            >
              <LogOut size={12} />
              <span>Log out of other sessions</span>
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar">
          {activeSessions.map((session) => (
            <div
              key={session.id}
              className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  {session.deviceType === 'mobile' ? (
                    <Smartphone size={16} />
                  ) : session.deviceType === 'tablet' ? (
                    <Tablet size={16} />
                  ) : (
                    <Laptop size={16} />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold">{session.deviceName || session.browser}</p>
                    {session.isCurrent && (
                      <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 text-[9px] font-bold rounded-md">
                        Current Device
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-500">
                    {session.location || 'Unknown'} • IP: {session.ipAddress} • Last active:{' '}
                    {new Date(session.lastActiveAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {!session.isCurrent && (
                <button
                  type="button"
                  onClick={() => revokeSession(session.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                  title="Revoke session"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Trusted Devices Management */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold">Trusted Devices ({trustedDevices.length})</h4>
          <button
            type="button"
            onClick={fetchTrustedDevices}
            className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
          >
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
          {trustedDevices.map((device) => (
            <div
              key={device.id}
              className="p-3 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  <Smartphone size={16} />
                </div>
                <div>
                  {editingDeviceId === device.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newDeviceName}
                        onChange={(e) => setNewDeviceName(e.target.value)}
                        placeholder={device.deviceName}
                        className="p-1 text-xs border rounded-md dark:bg-neutral-800"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveDeviceName(device.id)}
                        className="p-1 text-emerald-500"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold">{device.deviceName}</p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDeviceId(device.id);
                          setNewDeviceName(device.deviceName);
                        }}
                        className="text-neutral-400 hover:text-neutral-600"
                      >
                        <Edit2 size={11} />
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-neutral-500">
                    {device.browser} on {device.os} • {device.location}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => revokeDevice(device.id)}
                className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                title="Remove device"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Login Activity Logs */}
      <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold">Recent Security & Login Logs</h4>
          <button
            type="button"
            onClick={fetchSecurityLogs}
            className="text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 flex items-center gap-1"
          >
            <RefreshCw size={12} />
            <span>Sync</span>
          </button>
        </div>

        <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
          {securityLogs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                {log.status === 'success' ? (
                  <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-[11px]">
                    {log.browser} on {log.os} ({log.method})
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    {log.location} • IP: {log.ipAddress}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    log.status === 'success'
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                      : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                  }`}
                >
                  {log.status}
                </span>
                <p className="text-[9px] text-neutral-400 mt-0.5">
                  {new Date(log.timestamp || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
