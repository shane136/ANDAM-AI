import React, { useState } from 'react';
import { PhoneCall, ShieldCheck, Copy, Check, Search, MapPin, AlertCircle, Clock, ExternalLink } from 'lucide-react';
import { OFFICIAL_HOTLINES } from '../constants/iliganData';
import { Language } from '../types';

interface EmergencyHotlinesProps {
  language: Language;
}

export const EmergencyHotlines: React.FC<EmergencyHotlinesProps> = ({ language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: { ceb: 'Tanan nga Hotlines', fil: 'Lahat ng Hotlines', en: 'All Hotlines' } },
    { id: 'rescue', label: { ceb: 'CDRRMO / Rescue', fil: 'CDRRMO / Rescue', en: 'CDRRMO Rescue' } },
    { id: 'police', label: { ceb: 'Pulis (PNP)', fil: 'Pulisya (PNP)', en: 'Police (PNP)' } },
    { id: 'fire', label: { ceb: 'BFP Fire Station', fil: 'BFP Fire Station', en: 'Fire Dept (BFP)' } },
    { id: 'medical', label: { ceb: 'Ospital ug Red Cross', fil: 'Ospital at Red Cross', en: 'Hospitals & Medical' } },
    { id: 'utilities', label: { ceb: 'Kuryente ug Tubig', fil: 'Kuryente at Tubig', en: 'Utilities (ILPI/Water)' } },
  ];

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const filteredHotlines = OFFICIAL_HOTLINES.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.numbers.some((num) => num.includes(searchTerm));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="w-full space-y-6 py-2">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-slate-900 dark:text-white transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Verified Iligan City Contacts</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {language === 'ceb'
                ? 'Iligan City Emergency Hotlines'
                : language === 'fil'
                ? 'Iligan City Emergency Hotlines'
                : 'Iligan City Official Emergency Hotlines'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
              {language === 'ceb'
                ? 'Tipigi kini nga mga opisyal nga numero sa imong telepono. Tawag dayon sa ICDRRMD o Rescuers panahon sa baha, linog, o sunog.'
                : 'Keep these verified Iligan City emergency response numbers handy on your phone for immediate 1-tap dialing during disasters.'}
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-3xl p-6 text-center text-slate-900 dark:text-white shadow-md min-w-[290px] w-full md:w-auto">
            <span className="text-xs uppercase font-mono tracking-wider text-red-600 dark:text-red-400 block font-semibold">ICDRRMD 24/7 Communication Center</span>
            <div className="text-2xl font-black font-mono my-1 tracking-wider text-red-600 dark:text-red-400">
              (063) 221-8459
            </div>
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mb-1">
              📱 0997-726-2692 (Globe)
            </div>
            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 font-semibold mb-3">
              📱 0969-233-7878 (Smart)
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <a
                href="tel:0632218459"
                className="inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs uppercase tracking-wider px-3 py-2.5 rounded-xl transition shadow-sm cursor-pointer active:scale-98"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call 221-8459</span>
              </a>
              <a
                href="tel:09977262692"
                className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-semibold text-xs uppercase tracking-wider px-3 py-2.5 rounded-xl transition shadow-sm cursor-pointer active:scale-98"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Mobile</span>
              </a>
            </div>
            <a
              href="https://www.facebook.com/drrmoiligancity"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline pt-1"
            >
              <span>Official FB: fb.com/drrmoiligancity</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-semibold tracking-wide transition whitespace-nowrap border cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800'
              }`}
            >
              {cat.label[language]}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search agency or number..."
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 w-full shadow-2xs"
          />
        </div>
      </div>

      {/* Hotlines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredHotlines.map((hotline) => (
          <div
            key={hotline.id}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 hover:border-blue-500/60 transition duration-200 flex flex-col justify-between space-y-4 shadow-xs"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/40 font-semibold">
                    {hotline.agency}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2.5">{hotline.name}</h3>
                </div>
                {hotline.isAvailable247 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/40 font-semibold">
                    <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> 24/7
                  </span>
                )}
              </div>

              {hotline.description && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 leading-relaxed">{hotline.description}</p>
              )}

              {hotline.address && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-2.5 font-sans">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="truncate">{hotline.address}</span>
                </div>
              )}
            </div>

            {/* Phone Numbers List */}
            <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-semibold">
                Official Contact Numbers:
              </span>
              <div className="flex flex-wrap gap-2">
                {hotline.numbers.map((num, nIdx) => (
                  <div
                    key={nIdx}
                    className="flex items-center gap-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-2xs"
                  >
                    <span>{num}</span>
                    <a
                      href={`tel:${num.replace(/[^0-9+]/g, '')}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-white transition p-1 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                      title="Call directly"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleCopy(num)}
                      className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                      title="Copy number"
                    >
                      {copiedNumber === num ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Safety Notice Card */}
      <div className="bg-blue-50/60 dark:bg-slate-900/60 border border-blue-200/80 dark:border-slate-800 rounded-3xl p-5 flex items-start gap-3.5 text-xs text-slate-800 dark:text-slate-200">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wide block mb-1">Iligan City Public Safety Advisory:</strong>
          <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Panahon sa grabeng baha o kalamidad, unaha ang pagtawag sa <strong className="text-slate-900 dark:text-white font-bold">ICDRRMD Communication Center ((063) 221-8459 | 0997-726-2692 | 0969-233-7878)</strong>. Siguroha nga andam ang imong ensakto nga barangay ug street address alang sa paspas nga pagtubag sa mga responders.
          </span>
        </div>
      </div>
    </div>
  );
};
