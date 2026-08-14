import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatAssistant } from './components/ChatAssistant';
import { EmergencyHotlines } from './components/EmergencyHotlines';
import { BarangayHazardExplorer } from './components/BarangayHazardExplorer';
import { DisasterGuides } from './components/DisasterGuides';
import { GoBagChecklist } from './components/GoBagChecklist';
import { OfficialSources } from './components/OfficialSources';
import { Language, Theme } from './types';
import { ShieldAlert, PhoneCall, X, AlertOctagon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [language, setLanguage] = useState<Language>('ceb');
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('iligan_drrm_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });
  const [selectedBarangay, setSelectedBarangay] = useState<string>('Hinaplanon');
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('iligan_drrm_theme', theme);
  }, [theme]);

  const handleAskChatbotAboutBarangay = (bName: string) => {
    setSelectedBarangay(bName);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200 antialiased">
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        theme={theme}
        setTheme={setTheme}
        onEmergencyClick={() => setShowEmergencyModal(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 flex flex-col">
        {activeTab === 'chat' && (
          <ChatAssistant
            language={language}
            onNavigateToHotlines={() => setActiveTab('hotlines')}
            onNavigateToGoBag={() => setActiveTab('gobag')}
            selectedBarangay={selectedBarangay}
            setSelectedBarangay={setSelectedBarangay}
          />
        )}

        {activeTab === 'hotlines' && <EmergencyHotlines language={language} />}

        {activeTab === 'barangays' && (
          <BarangayHazardExplorer
            language={language}
            selectedBarangay={selectedBarangay}
            setSelectedBarangay={setSelectedBarangay}
            onAskChatbotAboutBarangay={handleAskChatbotAboutBarangay}
          />
        )}

        {activeTab === 'guides' && <DisasterGuides language={language} />}

        {activeTab === 'gobag' && <GoBagChecklist language={language} />}

        {activeTab === 'sources' && <OfficialSources language={language} />}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 py-4 px-4 text-center text-xs font-sans text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              © 2026 <strong className="text-slate-800 dark:text-slate-200 font-semibold">ANDAM AI</strong> • Disaster Risk Reduction & Management Hub
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span>Verified Sources:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">CDRRMO • DOST-PAGASA • PHIVOLCS</span>
          </div>
        </div>
      </footer>

      {/* Quick Emergency Action Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-red-500/30 dark:border-red-500/40 rounded-3xl max-w-lg w-full p-6 text-slate-900 dark:text-slate-100 space-y-5 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowEmergencyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-500/20 text-white animate-pulse">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-red-600 dark:text-red-400 uppercase tracking-tight">
                  ACTIVE EMERGENCY IN ILIGAN CITY?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Prioritize immediate physical safety and life-preservation!</p>
              </div>
            </div>

            <div className="bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-4 rounded-2xl space-y-2 text-xs">
              <strong className="font-mono text-[10px] uppercase tracking-widest text-red-700 dark:text-red-400 block font-bold">CRITICAL SAFETY PROTOCOLS:</strong>
              <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                <li>Kung paspas ang pag-saka sa tubig-baha, mobakwit dayon padulong sa mas taas nga dapit o evacuation center.</li>
                <li>Dala-a ang mga bata, tigulang, ug sakop sa pamilya nga kinahanglan og espesyal nga tabang.</li>
                <li>Ayaw gyud pagluwas sa kusog nga sulog o paglusong sa baha.</li>
              </ul>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400 block font-semibold">ICDRRMO 24/7 Hotline Numbers:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 font-mono font-bold text-xs">
                <a
                  href="tel:0632218459"
                  className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md shadow-red-600/20"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>221-8459</span>
                </a>
                <a
                  href="tel:09977262692"
                  className="bg-white hover:bg-slate-100 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-center gap-2 transition text-xs shadow-xs"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>0997-726-2692</span>
                </a>
                <a
                  href="tel:09692337878"
                  className="bg-white hover:bg-slate-100 text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-center gap-2 transition text-xs shadow-xs"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>0969-233-7878</span>
                </a>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowEmergencyModal(false);
                  setActiveTab('chat');
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-blue-600 dark:hover:bg-blue-700 font-semibold text-xs tracking-wide py-3 rounded-xl transition shadow-md cursor-pointer"
              >
                Launch AI Assistant in Emergency Mode
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
