import React, { useState } from 'react';
import { Globe, Check, Search } from 'lucide-react';

export const SettingsLanguageView: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [search, setSearch] = useState('');

  const languages = [
    { code: 'en-US', name: 'English (US)', native: 'English (US)' },
    { code: 'en-UK', name: 'English (UK)', native: 'English (UK)' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', native: 'Português (Brasil)' },
    { code: 'it', name: 'Italian', native: 'Italiano' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
    { code: 'ko', name: 'Korean', native: '한국어' },
    { code: 'zh-CN', name: 'Chinese (Simplified)', native: '简体中文' },
    { code: 'zh-TW', name: 'Chinese (Traditional)', native: '繁體中文' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'tr', name: 'Turkish', native: 'Türkçe' },
    { code: 'nl', name: 'Dutch', native: 'Nederlands' },
    { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
    { code: 'th', name: 'Thai', native: 'ไทย' },
  ];

  const filtered = languages.filter(
    (l) =>
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.native.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search languages..."
          className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl text-xs outline-none text-neutral-900 dark:text-white placeholder-neutral-400"
        />
      </div>

      {/* Language List */}
      <div className="space-y-1">
        {filtered.map((lang) => {
          const isSelected = selectedLanguage === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setSelectedLanguage(lang.code)}
              className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors cursor-pointer text-left ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200'
              }`}
            >
              <div>
                <p className="text-xs font-semibold">{lang.name}</p>
                <p className="text-[11px] text-neutral-500 font-normal">{lang.native}</p>
              </div>
              {isSelected && <Check size={16} className="text-blue-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
