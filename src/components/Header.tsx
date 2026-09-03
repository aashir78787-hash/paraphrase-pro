import React from 'react';
import {
  Sparkles,
  BookOpen,
  History,
  RotateCcw,
  FileText,
  HelpCircle,
  Activity,
  Layers,
} from 'lucide-react';
import { SAMPLE_TEXTS } from '../data/modes';

interface HeaderProps {
  onSelectSample: (sample: (typeof SAMPLE_TEXTS)[0]) => void;
  onOpenHistory: () => void;
  onOpenPromptRules: () => void;
  onClear: () => void;
  hasContent: boolean;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectSample,
  onOpenHistory,
  onOpenPromptRules,
  onClear,
  hasContent,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm text-gray-800">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center shadow-sm text-white font-bold text-lg">
            <span className="leading-none">P</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 flex items-center">
              ParaPhrase&nbsp;<span className="text-indigo-600">Pro</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] bg-gray-100 text-gray-600 rounded border border-gray-200 uppercase tracking-widest font-semibold">
              v2.4.0
            </span>
          </div>
        </div>

        {/* Center Engine Status */}
        <div className="hidden md:flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-medium text-gray-700">Gemini 3.7 Flash Connected</span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-500">Zero Hallucination Mode</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sample loader */}
          <div className="relative group">
            <button
              id="sample-preset-btn"
              type="button"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition"
              title="Load example text"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Presets</span>
            </button>
            <div className="absolute right-0 mt-1 w-64 py-1.5 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
              <div className="px-3 py-1 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
                Preset Test Samples
              </div>
              {SAMPLE_TEXTS.map((sample, idx) => (
                <button
                  key={idx}
                  id={`sample-item-${idx}`}
                  type="button"
                  onClick={() => onSelectSample(sample)}
                  className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex flex-col transition"
                >
                  <span className="font-semibold text-gray-800">{sample.title}</span>
                  <span className="text-[10px] text-gray-500">{sample.mode}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Master Prompt / Rules Modal Trigger */}
          <button
            id="open-rules-btn"
            type="button"
            onClick={onOpenPromptRules}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition"
            title="Inspect Master Paraphrasing Prompt & Principles"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden lg:inline">System Prompt Specs</span>
            <span className="lg:hidden">Specs</span>
          </button>

          {/* History Button */}
          <button
            id="open-history-btn"
            type="button"
            onClick={onOpenHistory}
            className="relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition"
            title="Paraphrase History"
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-600 text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* Clear Button */}
          {hasContent && (
            <button
              id="clear-workspace-btn"
              type="button"
              onClick={onClear}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
              title="Reset Editor"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

