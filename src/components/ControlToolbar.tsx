import React, { useState } from 'react';
import {
  Tag,
  X,
  Plus,
  Zap,
  Sparkles,
  FileCheck,
  CheckSquare,
  Square,
} from 'lucide-react';
import { TONE_OPTIONS } from '../data/modes';
import { ParaphraseModeId } from '../types';

interface ControlToolbarProps {
  mode: ParaphraseModeId;
  tone: string;
  onChangeTone: (tone: string) => void;
  keywords: string[];
  onAddKeyword: (kw: string) => void;
  onRemoveKeyword: (kw: string) => void;
  variationsCount: number;
  onChangeVariationsCount: (count: number) => void;
  temperature: number;
  onChangeTemperature: (temp: number) => void;
  includeChangeSummary: boolean;
  onToggleChangeSummary: (val: boolean) => void;
  onParaphrase: () => void;
  isLoading: boolean;
  disabled: boolean;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  mode,
  tone,
  onChangeTone,
  keywords,
  onAddKeyword,
  onRemoveKeyword,
  variationsCount,
  onChangeVariationsCount,
  temperature,
  onChangeTemperature,
  includeChangeSummary,
  onToggleChangeSummary,
  onParaphrase,
  isLoading,
  disabled,
}) => {
  const [keywordInput, setKeywordInput] = useState('');

  const handleKeywordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keywordInput.trim()) {
      onAddKeyword(keywordInput.trim());
      setKeywordInput('');
    }
  };

  const handleRawKeywordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
    // Replace keywords
    keywords.forEach((k) => onRemoveKeyword(k));
    parts.forEach((p) => onAddKeyword(p));
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Tone Adjustment */}
      <div>
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
          Tone Adjustment
        </label>
        <select
          id="tone-select"
          value={tone}
          onChange={(e) => onChangeTone(e.target.value)}
          className="w-full text-xs font-medium border border-gray-200 rounded px-2.5 py-1.5 bg-gray-50 text-gray-700 focus:ring-1 focus:ring-indigo-500 focus:bg-white outline-none cursor-pointer"
        >
          <option value="">Default / Match Source</option>
          {TONE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* Output Variations Count */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Generated Versions
          </label>
          <span className="text-[10px] text-gray-500 font-medium">{variationsCount} variation{variationsCount > 1 ? 's' : ''}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              id={`var-btn-${num}`}
              type="button"
              onClick={() => onChangeVariationsCount(num)}
              className={`py-1 rounded text-xs font-bold transition border ${
                variationsCount === num
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {num} {num === 1 ? 'Version' : 'Versions'}
            </button>
          ))}
        </div>
      </div>

      {/* Keywords to Preserve */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Keywords to Preserve
          </label>
          {mode === 'SEO-Aware' && (
            <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
              SEO Locked
            </span>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleKeywordSubmit} className="flex gap-1 mb-1.5">
          <input
            id="keyword-input-field"
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder="Add term or separate with commas..."
            className="flex-1 text-xs border border-gray-200 rounded px-2.5 py-1.5 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            id="add-keyword-btn"
            className="px-2 py-1.5 bg-gray-100 hover:bg-indigo-50 text-indigo-700 text-xs font-semibold rounded border border-gray-200 hover:border-indigo-200 transition flex items-center gap-0.5"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Keyword Pills */}
        {keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar p-1 bg-gray-50 border border-gray-200 rounded">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
              >
                <span>{kw}</span>
                <button
                  type="button"
                  onClick={() => onRemoveKeyword(kw)}
                  className="text-indigo-400 hover:text-rose-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-gray-400 italic">
            Exact phrases/brands here will remain strictly untouched.
          </p>
        )}
      </div>

      {/* Temperature / Freedom */}
      <div className="pt-2 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Rewrite Freedom
          </span>
          <span className="font-mono font-bold text-indigo-600 text-xs">
            {temperature.toFixed(2)}
          </span>
        </div>
        <input
          id="temp-slider"
          type="range"
          min="0.2"
          max="0.9"
          step="0.05"
          value={temperature}
          onChange={(e) => onChangeTemperature(parseFloat(e.target.value))}
          className="w-full accent-indigo-600 h-1.5 bg-gray-200 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
          <span>Strict (0.2)</span>
          <span>Balanced (0.6)</span>
          <span>Creative (0.9)</span>
        </div>
      </div>

      {/* Structured Summary Toggle */}
      <div className="pt-2 border-t border-gray-100">
        <label
          htmlFor="toggle-summary-checkbox"
          className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 select-none"
        >
          <input
            id="toggle-summary-checkbox"
            type="checkbox"
            checked={includeChangeSummary}
            onChange={(e) => onToggleChangeSummary(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="font-medium text-gray-700">Detailed Change Summary</span>
        </label>
      </div>
    </div>
  );
};

