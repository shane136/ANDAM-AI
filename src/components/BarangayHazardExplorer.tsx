import React, { useState } from 'react';
import { Search, MapPin, AlertTriangle, ShieldCheck, Waves, Mountain, CloudLightning, Home } from 'lucide-react';
import { ILIGAN_BARANGAYS } from '../constants/iliganData';
import { Language, BarangayInfo } from '../types';

interface BarangayHazardExplorerProps {
  language: Language;
  selectedBarangay: string;
  setSelectedBarangay: (b: string) => void;
  onAskChatbotAboutBarangay: (bName: string) => void;
}

export const BarangayHazardExplorer: React.FC<BarangayHazardExplorerProps> = ({
  language,
  selectedBarangay,
  setSelectedBarangay,
  onAskChatbotAboutBarangay,
}) => {
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [hazardFilter, setHazardFilter] = useState<string>('all');

  const districts = ['all', 'North', 'South', 'East', 'West', 'Central'];
  const hazardTypes = [
    { id: 'all', label: { ceb: 'Tanan nga Hazards', fil: 'Lahat ng Hazards', en: 'All Hazards' } },
    { id: 'flood', label: { ceb: 'Baha', fil: 'Baha', en: 'Flooding' } },
    { id: 'flash_flood', label: { ceb: 'Flash Flood (Mandulog/Iligan River)', fil: 'Flash Flood', en: 'Flash Flood' } },
    { id: 'landslide', label: { ceb: 'Pagdahili sa Yuta', fil: 'Landslide', en: 'Landslide' } },
    { id: 'storm_surge', label: { ceb: 'Storm Surge / Baybayon', fil: 'Storm Surge', en: 'Storm Surge' } },
  ];

  const filteredBarangays = ILIGAN_BARANGAYS.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase());
    const matchesDistrict = districtFilter === 'all' || b.district === districtFilter;
    const matchesHazard = hazardFilter === 'all' || b.hazards.includes(hazardFilter as any);
    return matchesSearch && matchesDistrict && matchesHazard;
  });

  const getHazardBadge = (hazard: string) => {
    switch (hazard) {
      case 'flash_flood':
        return (
          <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/50 text-[10px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full">
            <Waves className="w-3 h-3 text-red-600 dark:text-red-400" /> Flash Flood Basin
          </span>
        );
      case 'flood':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 text-[10px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full">
            <Waves className="w-3 h-3 text-blue-600 dark:text-blue-400" /> Flood Risk
          </span>
        );
      case 'landslide':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 text-[10px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full">
            <Mountain className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Landslide Hazard
          </span>
        );
      case 'storm_surge':
        return (
          <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-900/50 text-[10px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full">
            <CloudLightning className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Coastal Surge
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6 py-2">
      {/* Title Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-slate-900 dark:text-white transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'ceb'
                  ? 'Iligan City Barangay Risk & Evacuation Directory'
                  : language === 'fil'
                  ? 'Iligan City Barangay Hazard & Evacuation Directory'
                  : 'Iligan City Barangay DRRM Hazard Explorer'}
              </h2>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                44 Barangays
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">
              Susiha ang hazard vulnerability, MGB rating, river basins (Mandulog, Iligan River), ug designated evacuation centers sa tanang 44 ka barangay sa Iligan City.
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-3.5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search barangay..."
              className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 w-full shadow-2xs"
            />
          </div>

          {/* District Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">District:</span>
            {districts.map((dist) => (
              <button
                key={dist}
                onClick={() => setDistrictFilter(dist)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold tracking-wide transition whitespace-nowrap cursor-pointer ${
                  districtFilter === dist
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                {dist === 'all' ? 'All' : `${dist} District`}
              </button>
            ))}
          </div>
        </div>

        {/* Hazard Types Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-slate-100 dark:border-slate-800 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">Hazard Risk:</span>
          {hazardTypes.map((ht) => (
            <button
              key={ht.id}
              onClick={() => setHazardFilter(ht.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition whitespace-nowrap border cursor-pointer ${
                hazardFilter === ht.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 border-slate-200 dark:text-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {ht.label[language]}
            </button>
          ))}
        </div>
      </div>

      {/* Barangay Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBarangays.map((barangay) => {
          const isSelected = selectedBarangay === barangay.name;
          return (
            <div
              key={barangay.id}
              className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-xs ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-600/20 dark:border-blue-500 dark:ring-blue-500/30'
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-500/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                      {barangay.district} District {barangay.populationEstimate ? `• Pop: ${barangay.populationEstimate}` : ''}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Barangay {barangay.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedBarangay(barangay.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isSelected ? '✓ Selected' : 'Set Location'}
                  </button>
                </div>

                {/* Hazard Badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {barangay.hazards.map((h, hIdx) => (
                    <React.Fragment key={hIdx}>{getHazardBadge(h)}</React.Fragment>
                  ))}
                </div>

                {/* Risk Notes */}
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 mt-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-blue-600 dark:text-blue-400 font-semibold text-xs block mb-1">Local DRRM Focus:</strong>
                  {barangay.keyRiskNotes[language]}
                </div>

                {/* Designated Evacuation Centers */}
                {barangay.evacuationCentres && barangay.evacuationCentres.length > 0 && (
                  <div className="mt-3.5 text-xs space-y-1.5">
                    <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 text-xs">
                      <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Evacuation Center(s):
                    </span>
                    <ul className="list-disc pl-5 text-slate-600 dark:text-slate-400 text-xs space-y-0.5 font-sans">
                      {barangay.evacuationCentres.map((ec, ecIdx) => (
                        <li key={ecIdx}>{ec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onAskChatbotAboutBarangay(barangay.name)}
                className="w-full bg-slate-100 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 text-slate-800 dark:text-slate-200 font-semibold text-xs py-2.5 rounded-2xl transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs group"
              >
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:text-white transition-colors" />
                <span>Ask AI About Brgy {barangay.name}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
