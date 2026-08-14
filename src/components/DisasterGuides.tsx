import React, { useState } from 'react';
import { BookOpen, Waves, Activity, CloudLightning, Mountain, ShieldAlert, CheckCircle2, AlertTriangle, Play, Pause } from 'lucide-react';
import { HAZARD_GUIDES } from '../constants/iliganData';
import { Language, HazardGuide } from '../types';

interface DisasterGuidesProps {
  language: Language;
}

export const DisasterGuides: React.FC<DisasterGuidesProps> = ({ language }) => {
  const [selectedGuideId, setSelectedGuideId] = useState<string>(HAZARD_GUIDES[0].id);

  // Interactive Drop-Cover-Hold simulation state
  const [earthquakeSimStep, setEarthquakeSimStep] = useState<number>(0);

  const selectedGuide = HAZARD_GUIDES.find((g) => g.id === selectedGuideId) || HAZARD_GUIDES[0];

  const simSteps = [
    {
      title: 'STEP 1: DROP (Paniyuko / Pumayuko)',
      action: 'Drop onto your hands and knees immediately.',
      detail: 'Makatabang kini aron dili ka matumba sa kusog nga pag-uyog sa yuta ug dali ka makakamang sa luwas nga shelter.',
      bg: 'from-amber-600 to-amber-800',
    },
    {
      title: 'STEP 2: COVER (Sumilong / Lumilong)',
      action: 'Cover your head and neck under a sturdy table or desk.',
      detail: 'Protektahi ang imong ulo ug liog gikan sa nangatagak nga mga semento, salamin, ug appliances.',
      bg: 'from-blue-600 to-blue-800',
    },
    {
      title: 'STEP 3: HOLD ON (Kapot / Kumapot)',
      action: 'Hold on to your shelter until all shaking stops.',
      detail: 'Kapot og maayo sa mga tiil sa lamesa aron dili kini mabulag kanimo samtang naglihok ang yuta.',
      bg: 'from-green-600 to-green-800',
    },
  ];

  return (
    <div className="w-full space-y-6 py-2">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-slate-900 dark:text-white transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {language === 'ceb'
                ? 'Mga Opisyal nga Gabay sa Pagpangandam ug Kaluwasan'
                : language === 'fil'
                ? 'Opisyal na Gabay sa Paghahanda at Kaligtasan'
                : 'Iligan City Official DRRM Safety Guides'}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">
              Sayon sabton nga mga lakang sa wala pa, panahon sa, ug human sa kalamidad o emerhensya sa Iligan City.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Drop Cover Hold Drill Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-slate-900 dark:text-white transition-colors">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Earthquake Safety Protocol: DROP, COVER, HOLD</h3>
          </div>
          <span className="text-xs font-mono tracking-wider uppercase bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full font-bold">
            STEP {earthquakeSimStep + 1} OF 3
          </span>
        </div>

        {/* Drill Walkthrough Display */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 p-6 rounded-2xl transition-all shadow-2xs">
          <h4 className="text-base font-mono font-bold text-blue-600 dark:text-blue-400 mb-2 uppercase tracking-wide">{simSteps[earthquakeSimStep].title}</h4>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{simSteps[earthquakeSimStep].action}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-sans leading-relaxed shadow-2xs">
            {simSteps[earthquakeSimStep].detail}
          </p>
        </div>

        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setEarthquakeSimStep((prev) => (prev > 0 ? prev - 1 : 2))}
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-2xl transition border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            ← Previous
          </button>
          <div className="flex items-center gap-2">
            {simSteps.map((_, idx) => (
              <span
                key={idx}
                onClick={() => setEarthquakeSimStep(idx)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition ${
                  earthquakeSimStep === idx ? 'bg-blue-600 scale-125' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setEarthquakeSimStep((prev) => (prev < 2 ? prev + 1 : 0))}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl transition cursor-pointer shadow-xs shadow-blue-500/20"
          >
            Next Step →
          </button>
        </div>
      </div>

      {/* Guide Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {HAZARD_GUIDES.map((guide) => (
          <button
            key={guide.id}
            onClick={() => setSelectedGuideId(guide.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold tracking-wide transition whitespace-nowrap border cursor-pointer ${
              selectedGuideId === guide.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                : 'bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {guide.title[language]}
          </button>
        ))}
      </div>

      {/* Selected Guide Detail View */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedGuide.title[language]}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{selectedGuide.summary[language]}</p>
        </div>

        {/* 3 Phases: Before, During, After */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Phase 1: BEFORE */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>1. BEFORE (SA WALA PA)</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
              {selectedGuide.beforeSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-300 leading-relaxed">{step[language]}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phase 2: DURING */}
          <div className="bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-3xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-mono text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span>2. DURING (PANAHON SA)</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
              {selectedGuide.duringSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 text-slate-900 dark:text-white shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{step[language]}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Phase 3: AFTER */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-3.5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>3. AFTER (HUMAN SA)</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
              {selectedGuide.afterSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2.5 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600 dark:text-slate-300 leading-relaxed">{step[language]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Safety Tip Box */}
        <div className="bg-blue-50/60 dark:bg-slate-900/60 border border-blue-200/80 dark:border-slate-800 rounded-2xl p-4 text-xs font-medium text-blue-700 dark:text-blue-400 flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <span>{selectedGuide.safetyTip[language]}</span>
        </div>
      </div>
    </div>
  );
};
