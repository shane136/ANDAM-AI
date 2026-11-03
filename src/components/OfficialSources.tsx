import React from "react";
import { ExternalLink, ShieldCheck, AlertCircle, Globe } from "lucide-react";
import { OFFICIAL_SOURCES } from "../constants/iliganData";
import { Language } from "../types";

interface OfficialSourcesProps {
  language: Language;
}

export const OfficialSources: React.FC<OfficialSourcesProps> = ({
  language,
}) => {
  return (
    <div className="w-full space-y-6 py-2">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-slate-900 dark:text-white transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {language === "ceb"
                ? "Mga Opisyal nga Tuburan sa Impormasyon (Official Sources)"
                : language === "fil"
                  ? "Opisyal na Pinagmulan ng Impormasyon"
                  : "Verified Official Government DRRM Sources"}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">
              Kanunay nga i-verify ang balita gikan lamang sa mga opisyal nga
              ahensya sa gobyerno sama sa Iligan City Government, ICDRRMD,
              DOST-PAGASA, ug DOST-PHIVOLCS.
            </p>
          </div>
        </div>
      </div>

      {/* The app has no live bulletin feed, so send people to the agencies directly */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-sm transition-colors">
        <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>
            {language === "ceb"
              ? "Mga Bulletin ug Weather Advisory"
              : language === "fil"
                ? "Mga Bulletin at Weather Advisory"
                : "Bulletins & Weather Advisories"}
          </span>
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {language === "ceb"
            ? "Ang ANDAM AI wala magpakita og live nga bulletin gikan sa gobyerno. Para sa pinakabag-ong pahibalo ug advisory, susiha ang mga opisyal nga tuburan sa ubos."
            : language === "fil"
              ? "Hindi nagpapakita ang ANDAM AI ng live na bulletin mula sa gobyerno. Para sa pinakabagong babala at advisory, tingnan ang mga opisyal na pinagmulan sa ibaba."
              : "ANDAM AI does not show live government bulletins. For current warnings and advisories, check the official sources below."}
        </p>
      </div>

      {/* Primary Verified Web Portals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {OFFICIAL_SOURCES.map((source, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 hover:border-blue-500/60 transition flex flex-col justify-between space-y-5 shadow-xs"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  {source.name}
                </h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {source.description}
              </p>
            </div>

            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-3 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs shadow-blue-500/20"
            >
              <span>Visit {source.tag} Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>

      {/* No Fake News Warning */}
      <div className="bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-slate-800 dark:text-slate-200">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 block mb-1">
            Verify Before Sharing:
          </strong>
          <span className="text-slate-600 dark:text-slate-300 leading-relaxed">
            Ang mga linog ug bagyo DILI ma-predict pinaagi sa wala mailhing post
            sa social media. Kanunay mangayo ug mopakaylap lamang sa opisyal nga
            advisories gikan sa Iligan City Government, ICDRRMD, PAGASA, ug
            PHIVOLCS.
          </span>
        </div>
      </div>
    </div>
  );
};
