import React, { useState, useEffect } from 'react';
import { ShieldAlert, PhoneCall, MapPin, BookOpen, ShoppingBag, AlertTriangle, ExternalLink, Globe, MessageSquare, Clock, Radio, Sun, Moon } from 'lucide-react';
import { Language, Theme } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onEmergencyClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  theme,
  setTheme,
  onEmergencyClick,
}) => {
  const [timeString, setTimeString] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Manila' }) + ' PHT');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'chat', label: { ceb: 'AI Assistant', fil: 'AI Assistant', en: 'AI Assistant' }, icon: MessageSquare },
    { id: 'hotlines', label: { ceb: 'Emergency Hotlines', fil: 'Emergency Hotlines', en: 'Emergency Hotlines' }, icon: PhoneCall },
    { id: 'barangays', label: { ceb: 'Barangay Risks', fil: 'Barangay Risks', en: 'Barangay Risks' }, icon: MapPin },
    { id: 'guides', label: { ceb: 'Safety Guides', fil: 'Mga Gabay', en: 'Safety Guides' }, icon: BookOpen },
    { id: 'gobag', label: { ceb: 'Family Go-Bag', fil: 'Emergency Go-Bag', en: 'Family Go-Bag' }, icon: ShoppingBag },
    { id: 'sources', label: { ceb: 'Official Sources', fil: 'Opisyal na Link', en: 'Official Sources' }, icon: ExternalLink },
  ];

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 text-slate-900 dark:text-slate-100 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-50 backdrop-blur-md shadow-xs transition-colors duration-200">
      {/* Top Banner Alert / Emergency Dial Prompt */}
      <div className="bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-slate-200 border-b border-slate-800 px-4 md:px-8 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="truncate text-[11px] md:text-xs font-sans">
            <strong className="font-mono uppercase text-red-400 tracking-wider mr-1">ICDRRMD Emergency Hotlines:</strong>
            <span className="text-white font-bold font-mono">221-8459</span>
            <span className="mx-2 text-slate-600">|</span>
            <span className="text-slate-300 font-mono">0997-726-2692</span>
            <span className="mx-2 text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-300 font-mono hidden sm:inline">0969-233-7878</span>
          </span>
        </div>
        <button
          onClick={onEmergencyClick}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold uppercase tracking-wider text-[10px] px-3 py-1 rounded-full transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-xs shadow-red-600/30 active:scale-95"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Active Emergency?</span>
        </button>
      </div>

      {/* Main Header Container */}
      <div className="w-full px-4 md:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-3.5 cursor-pointer group" onClick={() => setActiveTab('chat')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition duration-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg md:text-xl tracking-tight text-slate-900 dark:text-white">
                  ANDAM AI
                </h1>
                <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full uppercase font-semibold">
                  VERIFIED HUB
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans">
                Your 24/7 AI Chatbot for Disaster Safety and Preparedness
              </p>
            </div>
          </div>

          {/* Theme & Language Toggle for Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setTheme('light')}
                className={`p-1.5 rounded-lg transition ${theme === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'}`}
                title="Light Mode"
              >
                <Sun className="w-4 h-4 text-amber-500" />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`p-1.5 rounded-lg transition ${theme === 'dark' ? 'bg-slate-700 text-white shadow-xs' : 'text-slate-400'}`}
                title="Dark Mode"
              >
                <Moon className="w-4 h-4 text-blue-400" />
              </button>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setLanguage('ceb')}
                className={`px-2 py-1 text-[10px] font-mono uppercase rounded-lg ${
                  language === 'ceb'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Ceb
              </button>
              <button
                onClick={() => setLanguage('fil')}
                className={`px-2 py-1 text-[10px] font-mono uppercase rounded-lg ${
                  language === 'fil'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Fil
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-[10px] font-mono uppercase rounded-lg ${
                  language === 'en'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Time / Status Indicator, Theme & Language Toggle on Desktop */}
        <div className="hidden lg:flex gap-3.5 items-center">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 flex items-center justify-end gap-1 font-mono">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>PHT Time</span>
            </p>
            <p className="text-xs font-mono text-slate-800 dark:text-slate-200 font-semibold">{timeString || '14:32:05 PHT'}</p>
          </div>
          <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-0.5 flex items-center justify-end gap-1 font-mono">
              <Radio className="w-3 h-3 text-emerald-500" />
              <span>Status</span>
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Active Monitoring</p>
          </div>
          <div className="h-7 w-[1px] bg-slate-200 dark:bg-slate-800"></div>

          {/* Desktop Theme Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-700 text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-blue-400" />
              <span>Dark</span>
            </button>
          </div>

          {/* Desktop Language Selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Globe className="w-3.5 h-3.5 text-slate-400 mx-1" />
            <button
              onClick={() => setLanguage('ceb')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                language === 'ceb'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bisaya
            </button>
            <button
              onClick={() => setLanguage('fil')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                language === 'fil'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Filipino
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                language === 'en'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200/80 dark:border-slate-800 overflow-x-auto scrollbar-none">
        <div className="w-full px-4 md:px-8 flex items-center space-x-1.5 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium tracking-wide transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-md shadow-blue-500/20 dark:bg-blue-600 dark:border-blue-600'
                    : 'bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/80 hover:text-slate-900 hover:bg-white dark:hover:text-white dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                <span>{item.label[language]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};


