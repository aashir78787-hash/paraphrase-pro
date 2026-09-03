import React, { useState } from 'react';
import {
  Sparkles,
  Wand2,
  GraduationCap,
  Glasses,
  Palette,
  MessageCircleHeart,
  Briefcase,
  Minimize2,
  Maximize2,
  ShieldCheck,
  SearchCode,
  Sliders,
  Check,
  Info,
} from 'lucide-react';
import { PARAPHRASE_MODES } from '../data/modes';
import { ParaphraseModeId } from '../types';

interface ModeSelectorProps {
  selectedMode: ParaphraseModeId;
  onSelectMode: (mode: ParaphraseModeId) => void;
  disabled?: boolean;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Wand2,
  GraduationCap,
  Glasses,
  Palette,
  MessageCircleHeart,
  Briefcase,
  Minimize2,
  Maximize2,
  ShieldCheck,
  SearchCode,
  Sliders,
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  selectedMode,
  onSelectMode,
  disabled,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const categories = ['All', 'General', 'Style', 'Length', 'Specialized'];

  const filteredModes = PARAPHRASE_MODES.filter(
    (m) => activeCategory === 'All' || m.category.includes(activeCategory) || (activeCategory === 'Style' && m.category === 'Style & Tone')
  );

  const activeModeConfig = PARAPHRASE_MODES.find((m) => m.id === selectedMode) || PARAPHRASE_MODES[0];

  return (
    <div className="flex flex-col">
      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Mode List Items */}
      <div className="space-y-1 overflow-y-auto max-h-[300px] pr-1 custom-scrollbar">
        {filteredModes.map((mode) => {
          const Icon = ICON_MAP[mode.iconName] || Sparkles;
          const isSelected = mode.id === selectedMode;

          return (
            <button
              key={mode.id}
              id={`mode-item-${mode.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectMode(mode.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition flex items-center justify-between border ${
                isSelected
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border-indigo-200 shadow-xs'
                  : 'text-gray-700 hover:bg-gray-50 border-transparent hover:border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                <span className="truncate">{mode.label}</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase tracking-tighter ${
                  isSelected
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {mode.shortTag}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mode Description Banner */}
      <div className="mt-2.5 p-2 bg-indigo-50/70 border border-indigo-100 rounded text-[11px] text-indigo-900 leading-snug">
        <span className="font-bold">{activeModeConfig.label}:</span> {activeModeConfig.guidance}
      </div>
    </div>
  );
};

