import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Circle, Plus, Trash2, Printer, Eye, X, Check, ShieldAlert, FileText } from 'lucide-react';
import { GO_BAG_ITEMS } from '../constants/iliganData';
import { Language, GoBagItem } from '../types';

interface GoBagChecklistProps {
  language: Language;
}

const CATEGORY_LABELS: Record<string, { ceb: string; fil: string; en: string }> = {
  all: { ceb: 'Tanan nga Kategoriya', fil: 'Lahat ng Kategorya', en: 'All Categories' },
  water_food: { ceb: 'Tubig ug Pagkaon', fil: 'Tubig at Pagkain', en: 'Water & Food' },
  first_aid: { ceb: 'First Aid ug Tambal', fil: 'Unang Lunas at Gamot', en: 'First Aid & Medicines' },
  tools_gear: { ceb: 'Kagamitan ug Gear', fil: 'Kagamitan at Gear', en: 'Tools & Gear' },
  documents_cash: { ceb: 'Dokumento ug Kuwarta', fil: 'Dokumento at Cash', en: 'Documents & Cash' },
  sanitation: { ceb: 'Kalimpyo ug Sapot', fil: 'Kalinisan at Damit', en: 'Sanitation & Clothing' },
  special_needs: { ceb: 'Special Needs / Custom', fil: 'Special Needs / Custom', en: 'Special Needs & Custom' },
};

export const GoBagChecklist: React.FC<GoBagChecklistProps> = ({ language }) => {
  const [items, setItems] = useState<GoBagItem[]>(() => {
    const saved = localStorage.getItem('iligan_gobag_items');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return GO_BAG_ITEMS;
      }
    }
    return GO_BAG_ITEMS;
  });

  const [newItemText, setNewItemText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [printCategory, setPrintCategory] = useState<string>('all');

  useEffect(() => {
    localStorage.setItem('iligan_gobag_items', JSON.stringify(items));
  }, [items]);

  const toggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: GoBagItem = {
      id: `custom-${Date.now()}`,
      category: 'special_needs',
      title: { ceb: newItemText, fil: newItemText, en: newItemText },
      checked: true,
      isEssential: false,
    };
    setItems((prev) => [...prev, newItem]);
    setNewItemText('');
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const totalItems = items.length;
  const checkedItems = items.filter((i) => i.checked).length;
  const percentage = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const openPrintPreview = () => {
    setPrintCategory(selectedCategory);
    setShowPrintPreview(true);
  };

  const filteredItems = items.filter(
    (i) => selectedCategory === 'all' || i.category === selectedCategory
  );

  // ONLY checked items are shown in print preview
  const previewItems = items.filter((item) => {
    if (!item.checked) return false;
    if (printCategory !== 'all' && item.category !== printCategory) return false;
    return true;
  });

  const categoriesList = ['all', 'water_food', 'first_aid', 'tools_gear', 'documents_cash', 'sanitation', 'special_needs'];

  return (
    <div className="w-full space-y-6 py-2">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm text-slate-900 dark:text-white transition-colors">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'ceb'
                  ? 'Family Emergency Go-Bag Checklist'
                  : language === 'fil'
                  ? 'Family Emergency Go-Bag Checklist'
                  : 'Family Emergency Go-Bag Checklist'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">
                Ang 72-hour Go-Bag kinahanglan andam na alang sa matag pamilya sa Iligan City aron dali kamo maka-evacuate.
              </p>
            </div>
          </div>

          <button
            onClick={openPrintPreview}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4.5 py-3 rounded-2xl transition flex items-center gap-2 shadow-xs shadow-blue-500/20 cursor-pointer shrink-0"
          >
            <Eye className="w-4 h-4" />
            <span>Print Preview</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 bg-slate-50 dark:bg-slate-950/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-400">Readiness Status: <strong className="text-slate-900 dark:text-white font-mono">{checkedItems} of {totalItems}</strong> items packed</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold font-mono">{percentage}% Ready</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            <div
              className="bg-blue-600 dark:bg-blue-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Categories Filter & Add Custom Item */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs transition-colors">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 shrink-0">Category:</span>
          {categoriesList.map((catKey) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition whitespace-nowrap border cursor-pointer ${
                selectedCategory === catKey
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {CATEGORY_LABELS[catKey]?.[language] || catKey}
            </button>
          ))}
        </div>

        {/* Custom Input */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            placeholder="Add custom item (e.g., baby formula, maintenance medicine)..."
            className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-600 dark:focus:border-blue-500 flex-1 shadow-2xs"
          />
          <button
            onClick={addItem}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl transition flex items-center gap-1.5 cursor-pointer shadow-xs shadow-blue-500/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Items Checklist List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 shadow-sm transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Showing {filteredItems.length} items ({CATEGORY_LABELS[selectedCategory]?.[language]})
          </span>
          <span className="text-xs text-slate-400">Click item to toggle status</span>
        </div>

        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            className={`p-4 rounded-2xl border transition duration-200 flex items-start justify-between gap-3 cursor-pointer ${
              item.checked
                ? 'bg-slate-50 border-slate-200/80 text-slate-400 dark:bg-slate-950/40 dark:border-slate-800 dark:text-slate-500'
                : 'bg-white border-slate-200 text-slate-900 hover:border-blue-500/60 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:hover:border-blue-500'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5">
                {item.checked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${item.checked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white font-semibold'}`}>
                    {item.title[language]}
                  </span>
                  {item.isEssential && (
                    <span className="bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900/50 text-[10px] font-semibold tracking-wide px-2.5 py-0.5 rounded-full">
                      Essential
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{item.description[language]}</p>
                )}
              </div>
            </div>

            {item.id.startsWith('custom-') && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item.id);
                }}
                className="text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400 p-1.5 transition cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* PRINT PREVIEW MODAL */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-8 shadow-2xl relative my-auto space-y-6">
            
            {/* Modal Header & Controls (Hidden when printing via .no-print) */}
            <div className="no-print space-y-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Print Preview</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Customize and verify the exact checklist before printing</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Controls Bar inside Preview Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Checklist Status:
                    </label>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Packed & Checked Items Only (Read-Only)
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                    Select Category Filter:
                  </label>
                  <select
                    value={printCategory}
                    onChange={(e) => setPrintCategory(e.target.value)}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-1.5 text-xs w-full focus:outline-none focus:border-blue-600 font-medium"
                  >
                    {categoriesList.map((catKey) => (
                      <option key={catKey} value={catKey}>
                        {CATEGORY_LABELS[catKey]?.[language] || catKey}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Showing {previewItems.length} packed items ready for printing
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPrintPreview(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Document</span>
                  </button>
                </div>
              </div>
            </div>

            {/* DOCUMENT PREVIEW CANVAS (Targeted by @media print as .print-preview-document) */}
            <div
              className={`print-preview-document bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-inner max-h-[60vh] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:p-0 ${
                previewItems.length > 8
                  ? 'p-5 space-y-2.5 print:space-y-2'
                  : 'p-6 sm:p-7 space-y-4 print:space-y-3'
              }`}
            >
              {/* Document Official Header */}
              <div
                className={`border-b-2 border-slate-900 flex items-start justify-between gap-4 ${
                  previewItems.length > 8 ? 'pb-2' : 'pb-3'
                }`}
              >
                <div>
                  <h1 className="text-[10px] sm:text-[11px] font-mono tracking-wider font-bold uppercase text-slate-700">
                    ILIGAN CITY DISASTER RISK REDUCTION & MANAGEMENT DEPARTMENT (ICDRRMD)
                  </h1>
                  <h2
                    className={`font-black text-slate-900 tracking-tight mt-0.5 ${
                      previewItems.length > 8 ? 'text-lg sm:text-xl print:text-lg' : 'text-xl sm:text-2xl'
                    }`}
                  >
                    FAMILY EMERGENCY GO-BAG CHECKLIST
                  </h2>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Official 72-Hour Survival Kit Directory • Prepared for Iligan City Household
                  </p>
                </div>
                <div className="text-right text-[10px] sm:text-[11px] text-slate-600 font-mono shrink-0">
                  <div>Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  <div className="font-bold text-slate-900 mt-0.5">Readiness: {checkedItems}/{totalItems} Packed ({percentage}%)</div>
                </div>
              </div>

              {/* Selected Filter Notice */}
              <div
                className={`bg-slate-100 border border-slate-300 rounded-xl font-medium text-slate-800 flex items-center justify-between print:bg-slate-50 ${
                  previewItems.length > 8 ? 'px-3 py-1.5 text-[11px]' : 'px-3.5 py-2 text-xs'
                }`}
              >
                <span>
                  <strong>Selected View:</strong> Verified Packed Items Only • Category: {CATEGORY_LABELS[printCategory]?.[language] || printCategory}
                </span>
                <span className="font-mono text-[10px] sm:text-[11px] font-bold text-emerald-700">
                  ✓ {previewItems.length} packed items
                </span>
              </div>

              {/* Items Table */}
              <div className="space-y-1">
                {previewItems.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 italic border border-dashed border-slate-300 rounded-xl space-y-1.5">
                    <p className="font-semibold text-slate-700 text-sm">Walay na-check o na-pack nga items nga mapakita.</p>
                    <p>Palihog i-check una ang mga gamit nga imong gi-andam sa checklist sa dili pa ablihan ang print preview.</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-[10px] sm:text-[11px] font-mono text-slate-700 uppercase">
                        <th className={`px-2 w-12 text-center ${previewItems.length > 8 ? 'py-1' : 'py-1.5'}`}>Status</th>
                        <th className={`px-2 ${previewItems.length > 8 ? 'py-1' : 'py-1.5'}`}>Item Title</th>
                        <th className={`px-2 w-28 sm:w-32 ${previewItems.length > 8 ? 'py-1' : 'py-1.5'}`}>Category</th>
                        <th className={`px-2 ${previewItems.length > 8 ? 'py-1' : 'py-1.5'}`}>Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {previewItems.map((item) => (
                        <tr key={item.id} className="align-top hover:bg-slate-50/80 transition-colors">
                          <td className={`px-2 text-center ${previewItems.length > 8 ? 'py-1' : 'py-1.5'}`}>
                            <div className="flex items-center justify-center">
                              {/* Static Check Mark */}
                              <div className="w-4 h-4 rounded bg-emerald-600 text-white flex items-center justify-center print:border print:border-emerald-700 print:bg-emerald-50 print:text-emerald-700 shadow-2xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            </div>
                          </td>
                          <td className={`px-2 font-semibold text-slate-900 ${previewItems.length > 8 ? 'py-1' : 'py-1.5'}`}>
                            {item.title[language]}
                            {item.isEssential && (
                              <span className="ml-1.5 text-[8px] font-mono font-bold uppercase text-red-700 bg-red-100 px-1 py-0.2 rounded border border-red-300">
                                Essential
                              </span>
                            )}
                          </td>
                          <td className={`px-2 text-[10px] text-slate-600 font-mono ${previewItems.length > 8 ? 'py-1' : 'py-1.5'}`}>
                            {CATEGORY_LABELS[item.category]?.[language] || item.category}
                          </td>
                          <td className={`px-2 text-slate-600 text-[10px] leading-snug ${previewItems.length > 8 ? 'py-1' : 'py-1.5'}`}>
                            {item.description?.[language] || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Document Footer Notes */}
              <div
                className={`border-t border-slate-300 text-[10px] sm:text-[11px] text-slate-600 space-y-0.5 ${
                  previewItems.length > 8 ? 'pt-2' : 'pt-2.5'
                }`}
              >
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                  <span>Iligan City Disaster Risk Reduction and Management Department Emergency Contacts:</span>
                </div>
                <p>
                  ICDRRMD 24/7 Communication Center: <strong>(063) 221-8459</strong> | <strong>0997-726-2692</strong> (Globe) | <strong>0969-233-7878</strong> (Smart)
                </p>
                <p className="text-[9px] text-slate-500 italic">
                  Keep your Go-Bag stored near your main exit door. Inspect food, water, and prescription medicines every 6 months.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

