import React, { useState } from 'react';
import { X, Camera, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const EditProfileModal: React.FC = () => {
  const { currentUser, updateProfile, isEditProfileOpen, setIsEditProfileOpen, celebrateAction } = useApp();

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [website, setWebsite] = useState(currentUser.website || '');
  const [pronouns, setPronouns] = useState(currentUser.pronouns || '');
  const [avatar, setAvatar] = useState(currentUser.avatar);

  if (!isEditProfileOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      username,
      bio,
      website,
      pronouns,
      avatar,
    });
    celebrateAction();
    setIsEditProfileOpen(false);
  };

  const handleAvatarSelect = (url: string) => {
    setAvatar(url);
  };

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div
        className="absolute inset-0"
        onClick={() => setIsEditProfileOpen(false)}
      />

      <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl border border-slate-100 dark:border-neutral-800 shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => setIsEditProfileOpen(false)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white"
          >
            Cancel
          </button>
          <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
            Edit Profile
          </h3>
          <button
            type="button"
            onClick={handleSave}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            Done
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
          {/* Avatar selector */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <img
                src={avatar}
                alt="Profile"
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 dark:border-neutral-700 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              {avatarPresets.map((preset, i) => (
                <img
                  key={i}
                  src={preset}
                  alt={`Preset ${i}`}
                  onClick={() => handleAvatarSelect(preset)}
                  referrerPolicy="no-referrer"
                  className={`w-8 h-8 rounded-full object-cover cursor-pointer border transition-transform hover:scale-110 ${
                    avatar === preset ? 'ring-2 ring-indigo-500 scale-105' : 'border-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm p-3 rounded-2xl bg-slate-100 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 text-slate-900 dark:text-white outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full text-sm p-3 rounded-2xl bg-slate-100 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 text-slate-900 dark:text-white outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Pronouns
              </label>
              <input
                type="text"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
                placeholder="she/her, he/him, they/them..."
                className="w-full text-sm p-3 rounded-2xl bg-slate-100 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 text-slate-900 dark:text-white outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full text-sm p-3 rounded-2xl bg-slate-100 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 text-slate-900 dark:text-white outline-none focus:border-slate-800"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Website
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="w-full text-sm p-3 rounded-2xl bg-slate-100 dark:bg-neutral-800 border border-slate-200/80 dark:border-neutral-700 text-slate-900 dark:text-white outline-none focus:border-slate-800"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
