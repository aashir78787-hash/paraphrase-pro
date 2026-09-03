import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ModeSelector } from './components/ModeSelector';
import { ControlToolbar } from './components/ControlToolbar';
import { EditorWorkspace } from './components/EditorWorkspace';
import { HistoryDrawer } from './components/HistoryDrawer';
import { MasterPromptModal } from './components/MasterPromptModal';
import { SynonymModal } from './components/SynonymModal';
import { PARAPHRASE_MODES, SAMPLE_TEXTS } from './data/modes';
import {
  ParaphraseModeId,
  ParaphraseVariation,
  ChangeSummary,
  ParaphraseHistoryItem,
} from './types';

const STORAGE_KEY = 'paraphrase_pro_history_v1';

export default function App() {
  const [sourceText, setSourceText] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<ParaphraseModeId>('Standard');
  const [tone, setTone] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [variationsCount, setVariationsCount] = useState<number>(1);
  const [temperature, setTemperature] = useState<number>(0.6);
  const [includeChangeSummary, setIncludeChangeSummary] = useState<boolean>(false);

  const [variations, setVariations] = useState<ParaphraseVariation[]>([]);
  const [activeVersionIndex, setActiveVersionIndex] = useState<number>(0);
  const [summaryOfChanges, setSummaryOfChanges] = useState<ChangeSummary | undefined>(undefined);
  const [estimatedOriginality, setEstimatedOriginality] = useState<number | undefined>(undefined);
  const [detectedLanguage, setDetectedLanguage] = useState<string | undefined>(undefined);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [synonymModal, setSynonymModal] = useState<{
    isOpen: boolean;
    word: string;
    sentenceContext: string;
  }>({
    isOpen: false,
    word: '',
    sentenceContext: '',
  });

  // History State
  const [history, setHistory] = useState<ParaphraseHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [history]);

  // Adjust temperature defaults when mode changes
  const handleSelectMode = (mode: ParaphraseModeId) => {
    setSelectedMode(mode);
    const config = PARAPHRASE_MODES.find((m) => m.id === mode);
    if (config) {
      setTemperature(config.recommendedTemp);
    }
  };

  const handleAddKeyword = (kw: string) => {
    if (kw.trim() && !keywords.includes(kw.trim())) {
      setKeywords([...keywords, kw.trim()]);
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((k) => k !== kw));
  };

  // Execute Paraphrase
  const handleParaphrase = useCallback(async () => {
    if (!sourceText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/paraphrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          mode: selectedMode,
          tone: tone || undefined,
          keywords: keywords.length > 0 ? keywords : undefined,
          variationsCount,
          temperature,
          includeChangeSummary,
        }),
      });

      let json: any;
      try {
        json = await res.json();
      } catch (parseErr) {
        throw new Error(
          res.ok
            ? 'Received invalid response format from server.'
            : `Server error (${res.status}: ${res.statusText || 'Service Unavailable'}). Please try again.`
        );
      }

      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Paraphrasing request failed. Please try again.');
      }

      const data = json.data;
      const returnedVariations: ParaphraseVariation[] = data.variations || [];
      setVariations(returnedVariations);
      setActiveVersionIndex(0);
      setSummaryOfChanges(data.summaryOfChanges);
      setEstimatedOriginality(data.estimatedOriginalityScore);
      setDetectedLanguage(data.detectedLanguage);

      // Save to history
      if (returnedVariations.length > 0) {
        const newHistoryItem: ParaphraseHistoryItem = {
          id: String(Date.now()),
          timestamp: Date.now(),
          originalText: sourceText,
          paraphrasedText: returnedVariations[0].paraphrasedText,
          mode: selectedMode,
          tone: tone || undefined,
          keywords: keywords.length > 0 ? keywords : undefined,
          variationsCount: returnedVariations.length,
          originalityScore: data.estimatedOriginalityScore,
        };
        setHistory((prev) => [newHistoryItem, ...prev.slice(0, 49)]); // Keep latest 50
      }
    } catch (err: any) {
      console.error('Paraphrase request failed:', err);
      let message = err.message || 'An error occurred during paraphrasing.';
      if (message === 'Failed to fetch' || message.includes('fetch')) {
        message = 'Unable to reach the paraphrasing service. Please check your connection and click "Try Again".';
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    sourceText,
    selectedMode,
    tone,
    keywords,
    variationsCount,
    temperature,
    includeChangeSummary,
    isLoading,
  ]);

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleParaphrase();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleParaphrase]);

  // Sample selector
  const handleSelectSample = (sample: (typeof SAMPLE_TEXTS)[0]) => {
    setSourceText(sample.text);
    handleSelectMode(sample.mode);
    if (sample.tone) setTone(sample.tone);
    if ('keywords' in sample && sample.keywords) {
      setKeywords(sample.keywords);
    } else {
      setKeywords([]);
    }
  };

  // Restore history item
  const handleRestoreHistory = (item: ParaphraseHistoryItem) => {
    setSourceText(item.originalText);
    setSelectedMode(item.mode);
    if (item.tone) setTone(item.tone);
    if (item.keywords) setKeywords(item.keywords);
    setVariations([
      {
        version: 1,
        paraphrasedText: item.paraphrasedText,
        shortDescription: 'Restored from history',
      },
    ]);
    setActiveVersionIndex(0);
    setSummaryOfChanges(undefined);
    setEstimatedOriginality(item.originalityScore);
  };

  // Swap text back to source to iterate
  const handleSwapText = () => {
    const activeText = variations[activeVersionIndex]?.paraphrasedText;
    if (activeText) {
      setSourceText(activeText);
      setVariations([]);
      setSummaryOfChanges(undefined);
      setEstimatedOriginality(undefined);
    }
  };

  // Clear all
  const handleClear = () => {
    setSourceText('');
    setVariations([]);
    setSummaryOfChanges(undefined);
    setEstimatedOriginality(undefined);
    setError(null);
  };

  // Contextual Synonym Replacement
  const handleWordClick = (word: string, contextSentence: string) => {
    setSynonymModal({
      isOpen: true,
      word,
      sentenceContext: contextSentence,
    });
  };

  const handleSelectSynonymReplacement = (newWord: string) => {
    if (!variations[activeVersionIndex]) return;
    const current = variations[activeVersionIndex].paraphrasedText;
    const targetWord = synonymModal.word;

    // Replace first occurrence of word with boundary check
    const regex = new RegExp(`\\b${targetWord}\\b`, 'i');
    const updated = current.replace(regex, newWord);

    const updatedVariations = [...variations];
    updatedVariations[activeVersionIndex] = {
      ...updatedVariations[activeVersionIndex],
      paraphrasedText: updated,
    };
    setVariations(updatedVariations);
  };

  return (
    <div className="h-screen w-full bg-[#F3F4F6] text-[#1F2937] flex flex-col font-sans overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        onSelectSample={handleSelectSample}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPromptRules={() => setIsRulesOpen(true)}
        onClear={handleClear}
        hasContent={Boolean(sourceText || variations.length)}
        historyCount={history.length}
      />

      {/* Main Two-Column High Density Workspace */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Controls & Mode Sidebar */}
        <aside className="w-full md:w-80 lg:w-84 bg-white border-r border-gray-200 flex flex-col overflow-y-auto custom-scrollbar p-3.5 space-y-4 shrink-0 shadow-xs">
          {/* Section: Modes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Paraphrase Mode
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold">
                12 Modes Available
              </span>
            </div>
            <ModeSelector
              selectedMode={selectedMode}
              onSelectMode={handleSelectMode}
              disabled={isLoading}
            />
          </div>

          <div className="border-t border-gray-200" />

          {/* Section: Configuration & Tuning */}
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5 block">
              Configuration & Tuning
            </span>
            <ControlToolbar
              mode={selectedMode}
              tone={tone}
              onChangeTone={setTone}
              keywords={keywords}
              onAddKeyword={handleAddKeyword}
              onRemoveKeyword={handleRemoveKeyword}
              variationsCount={variationsCount}
              onChangeVariationsCount={setVariationsCount}
              temperature={temperature}
              onChangeTemperature={setTemperature}
              includeChangeSummary={includeChangeSummary}
              onToggleChangeSummary={setIncludeChangeSummary}
              onParaphrase={handleParaphrase}
              isLoading={isLoading}
              disabled={!sourceText.trim()}
            />
          </div>
        </aside>

        {/* Right Editor & Diff Analysis Workspace */}
        <section className="flex-1 flex flex-col p-3 sm:p-4 overflow-y-auto custom-scrollbar">
          <EditorWorkspace
            sourceText={sourceText}
            onChangeSource={setSourceText}
            variations={variations}
            activeVersionIndex={activeVersionIndex}
            onSelectVersion={setActiveVersionIndex}
            summaryOfChanges={summaryOfChanges}
            estimatedOriginality={estimatedOriginality}
            detectedLanguage={detectedLanguage}
            onWordClick={handleWordClick}
            onSwapText={handleSwapText}
            onParaphrase={handleParaphrase}
            isLoading={isLoading}
            error={error}
          />
        </section>
      </main>

      {/* Modals & Drawers */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onRestore={handleRestoreHistory}
        onClearHistory={() => setHistory([])}
        onDeleteItem={(id) => setHistory((prev) => prev.filter((item) => item.id !== id))}
      />

      <MasterPromptModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      <SynonymModal
        isOpen={synonymModal.isOpen}
        word={synonymModal.word}
        sentenceContext={synonymModal.sentenceContext}
        tone={tone || 'Neutral'}
        onClose={() => setSynonymModal((prev) => ({ ...prev, isOpen: false }))}
        onSelectReplacement={handleSelectSynonymReplacement}
      />
    </div>
  );
}

