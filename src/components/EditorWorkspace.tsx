import React, { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  Volume2,
  VolumeX,
  ArrowLeftRight,
  Sparkles,
  Layers,
  FileCheck,
  Eye,
  GitCompare,
  Columns,
  UploadCloud,
  FileText,
  RotateCcw,
  ClipboardPaste,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Percent,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  ParaphraseVariation,
  ChangeSummary,
  TextMetrics,
  DiffSegment,
} from '../types';
import { calculateTextMetrics, computeWordDiff, calculateDivergenceScore } from '../utils/diff';

interface EditorWorkspaceProps {
  sourceText: string;
  onChangeSource: (text: string) => void;
  variations: ParaphraseVariation[];
  activeVersionIndex: number;
  onSelectVersion: (index: number) => void;
  summaryOfChanges?: ChangeSummary;
  estimatedOriginality?: number;
  detectedLanguage?: string;
  onWordClick: (word: string, contextSentence: string) => void;
  onSwapText: () => void;
  onParaphrase?: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const EditorWorkspace: React.FC<EditorWorkspaceProps> = ({
  sourceText,
  onChangeSource,
  variations,
  activeVersionIndex,
  onSelectVersion,
  summaryOfChanges,
  estimatedOriginality,
  detectedLanguage,
  onWordClick,
  onSwapText,
  onParaphrase,
  isLoading,
  error,
}) => {
  const [viewMode, setViewMode] = useState<'clean' | 'diff' | 'sideBySide'>('clean');
  const [copied, setCopied] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [strictEntityLock, setStrictEntityLock] = useState(true);
  const [maintainFormatting, setMaintainFormatting] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeVariation = variations[activeVersionIndex] || variations[0];
  const activeParaphrasedText = activeVariation?.paraphrasedText || '';

  // Metrics
  const sourceMetrics: TextMetrics = calculateTextMetrics(sourceText);
  const targetMetrics: TextMetrics = calculateTextMetrics(activeParaphrasedText);

  // Divergence score calculation
  const calculatedDivergence = sourceText && activeParaphrasedText
    ? calculateDivergenceScore(sourceText, activeParaphrasedText)
    : 0;
  const finalOriginalityScore = estimatedOriginality ?? calculatedDivergence;
  const similarityScore = Math.max(0, 100 - finalOriginalityScore);

  // Length difference calculation
  const wordDiffPercent =
    sourceMetrics.words > 0 && targetMetrics.words > 0
      ? Math.round(((targetMetrics.words - sourceMetrics.words) / sourceMetrics.words) * 100)
      : 0;

  // Diff computation
  const diffSegments: DiffSegment[] = React.useMemo(() => {
    if (viewMode !== 'diff' || !sourceText || !activeParaphrasedText) return [];
    return computeWordDiff(sourceText, activeParaphrasedText);
  }, [viewMode, sourceText, activeParaphrasedText]);

  // Speech synthesis
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (activeParaphrasedText) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeParaphrasedText);
      utterance.rate = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopy = () => {
    if (!activeParaphrasedText) return;
    navigator.clipboard.writeText(activeParaphrasedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAll = () => {
    if (!variations.length) return;
    const formatted = variations
      .map((v, i) => `Version ${v.version} (${v.shortDescription || 'Variation'}):\n${v.paraphrasedText}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(formatted);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownload = (format: 'txt' | 'md') => {
    if (!activeParaphrasedText) return;
    const content =
      format === 'md'
        ? `# ParaPhrase Pro Output\n\n## Paraphrased Version\n\n${activeParaphrasedText}\n\n---\n*Original Words: ${sourceMetrics.words} | Output Words: ${targetMetrics.words} | Originality: ${finalOriginalityScore}%*`
        : activeParaphrasedText;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `paraphrased_output.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) onChangeSource(text);
    } catch {
      // Fallback
    }
  };

  const handleFileUpload = (file: File) => {
    if (file && (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) onChangeSource(text);
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Render interactive text with clickable words
  const renderInteractiveText = (text: string) => {
    const tokens = text.split(/(\s+)/);
    return tokens.map((token, i) => {
      if (/^\s+$/.test(token)) {
        return <span key={i}>{token}</span>;
      }
      const cleanWord = token.replace(/[^\w'-]/g, '');
      if (cleanWord.length > 2) {
        return (
          <span
            key={i}
            onClick={() => onWordClick(cleanWord, text)}
            className="hover:bg-indigo-100 hover:text-indigo-900 rounded px-0.5 cursor-pointer transition select-text"
            title="Click to explore contextual synonyms"
          >
            {token}
          </span>
        );
      }
      return <span key={i}>{token}</span>;
    });
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Upper Dual Pane Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[440px] relative">
        {/* LEFT CARD: SOURCE TEXT */}
        <div
          className={`flex flex-col bg-white rounded-lg border shadow-sm transition ${
            isDraggingFile ? 'border-indigo-500 bg-indigo-50/20 ring-2 ring-indigo-500/20' : 'border-gray-200'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Source Text
              </span>
              {detectedLanguage && (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-gray-100 text-gray-500 border border-gray-200">
                  {detectedLanguage}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-gray-400">
                {sourceMetrics.characters} Characters • {sourceMetrics.words} Words
              </span>
              <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2">
                <button
                  id="source-paste-btn"
                  type="button"
                  onClick={handlePaste}
                  className="p-1 hover:text-indigo-600 rounded text-gray-400 hover:bg-gray-100 transition"
                  title="Paste from clipboard"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                </button>
                <button
                  id="source-upload-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1 hover:text-indigo-600 rounded text-gray-400 hover:bg-gray-100 transition"
                  title="Upload .txt or .md"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
                {sourceText && (
                  <button
                    id="source-clear-btn"
                    type="button"
                    onClick={() => onChangeSource('')}
                    className="p-1 hover:text-rose-600 rounded text-gray-400 hover:bg-gray-100 transition"
                    title="Clear text"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Text Area */}
          <div className="flex-1 p-4 flex flex-col">
            <textarea
              id="source-text-input"
              value={sourceText}
              onChange={(e) => onChangeSource(e.target.value)}
              placeholder="Paste text to paraphrase, or type directly..."
              className="w-full flex-1 text-sm leading-relaxed text-gray-800 outline-none resize-none placeholder:text-gray-400 min-h-[300px]"
            />
          </div>

          {/* Source Footer Stats */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/40 flex items-center justify-between text-[11px] text-gray-500">
            <span>
              Reading Time: <strong className="text-gray-700 font-semibold">{sourceMetrics.readingTimeSeconds}s</strong>
            </span>
            {sourceMetrics.fleschKincaidGrade && (
              <span>
                Readability: <strong className="text-gray-700 font-semibold">{sourceMetrics.fleschKincaidGrade}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Center Swap Button (Overlay on desktop) */}
        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <button
            id="swap-center-btn"
            type="button"
            disabled={!activeParaphrasedText}
            onClick={onSwapText}
            className={`pointer-events-auto p-2 rounded-full bg-white border border-gray-200 shadow-md text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:scale-105 transition ${
              !activeParaphrasedText ? 'opacity-30 cursor-not-allowed' : 'opacity-100'
            }`}
            title="Swap Paraphrase back to Original Input"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT CARD: PARAPHRASED RESULT */}
        <div className="flex flex-col bg-white rounded-lg border border-gray-200 shadow-sm relative">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-gray-50/70">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                Paraphrased Result
              </span>

              {/* Version Tabs */}
              {variations.length > 1 && (
                <div className="flex items-center bg-gray-200/70 rounded p-0.5 border border-gray-200">
                  {variations.map((v, idx) => (
                    <button
                      key={idx}
                      id={`version-tab-${idx + 1}`}
                      type="button"
                      onClick={() => onSelectVersion(idx)}
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold transition ${
                        activeVersionIndex === idx
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      v{v.version}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Actions & View Controls */}
            <div className="flex items-center gap-1.5">
              {/* View Switches */}
              {activeParaphrasedText && (
                <div className="flex items-center bg-gray-100 rounded p-0.5 border border-gray-200 text-[11px]">
                  <button
                    id="view-clean-btn"
                    type="button"
                    onClick={() => setViewMode('clean')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      viewMode === 'clean'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Clean readable text"
                  >
                    Clean
                  </button>
                  <button
                    id="view-diff-btn"
                    type="button"
                    onClick={() => setViewMode('diff')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      viewMode === 'diff'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Diff highlights"
                  >
                    Diff
                  </button>
                  <button
                    id="view-side-btn"
                    type="button"
                    onClick={() => setViewMode('sideBySide')}
                    className={`px-2 py-0.5 rounded font-medium transition ${
                      viewMode === 'sideBySide'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                    title="Compare columns"
                  >
                    Compare
                  </button>
                </div>
              )}

              {/* Speech button */}
              {activeParaphrasedText && (
                <button
                  id="tts-audio-btn"
                  type="button"
                  onClick={handleToggleSpeech}
                  className={`p-1.5 rounded hover:bg-gray-100 transition ${
                    isSpeaking ? 'text-indigo-600 bg-indigo-50 animate-pulse' : 'text-gray-400 hover:text-indigo-600'
                  }`}
                  title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                >
                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              )}

              {/* Copy */}
              {activeParaphrasedText && (
                <button
                  id="copy-output-btn"
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 hover:text-indigo-600 rounded text-gray-400 hover:bg-gray-100 transition"
                  title="Copy output"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              )}

              {/* Download */}
              {activeParaphrasedText && (
                <div className="relative group">
                  <button
                    id="download-menu-btn"
                    type="button"
                    className="p-1.5 hover:text-indigo-600 rounded text-gray-400 hover:bg-gray-100 transition"
                    title="Export file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-1 w-32 py-1 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition z-30 text-xs">
                    <button
                      type="button"
                      onClick={() => handleDownload('txt')}
                      className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Save as .txt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload('md')}
                      className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Save as .md
                    </button>
                    {variations.length > 1 && (
                      <button
                        type="button"
                        onClick={handleCopyAll}
                        className="w-full text-left px-3 py-1.5 text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 border-t border-gray-100"
                      >
                        {copiedAll ? 'Copied all!' : 'Copy all variations'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 p-4 bg-indigo-50/10 overflow-y-auto min-h-[300px] flex flex-col">
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-500 py-16">
                <div className="w-7 h-7 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-800">Processing with Gemini 3.7 Flash...</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Restructuring phrasing with zero hallucination constraints
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-rose-900 text-xs space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-rose-800">Paraphrasing Notice</p>
                    <p className="mt-1 text-rose-700 leading-relaxed">{error}</p>
                  </div>
                  {onParaphrase && (
                    <button
                      type="button"
                      onClick={onParaphrase}
                      className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold text-xs shadow-xs transition"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            ) : !activeParaphrasedText ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 py-16 px-4">
                <Sparkles className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm font-semibold text-gray-600">Ready to paraphrase</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Enter your text, pick a mode from the sidebar, and click "REWRITE".
                </p>
              </div>
            ) : (
              <div className="space-y-4 flex-1">
                {/* Variation tag */}
                {activeVariation.shortDescription && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                    <span>{activeVariation.shortDescription}</span>
                  </div>
                )}

                {/* View: Clean */}
                {viewMode === 'clean' && (
                  <div className="text-gray-800 text-sm leading-relaxed select-text whitespace-pre-wrap">
                    {renderInteractiveText(activeParaphrasedText)}
                  </div>
                )}

                {/* View: Diff Highlights */}
                {viewMode === 'diff' && (
                  <div className="text-gray-800 text-sm leading-relaxed select-text whitespace-pre-wrap p-3 rounded-md bg-white border border-gray-200">
                    {diffSegments.map((seg, idx) => {
                      if (seg.type === 'added') {
                        return (
                          <span
                            key={idx}
                            className="bg-emerald-50 text-emerald-800 font-medium px-1 py-0.2 rounded border border-emerald-200 mx-0.5"
                          >
                            {seg.text}
                          </span>
                        );
                      }
                      if (seg.type === 'removed') {
                        return (
                          <span
                            key={idx}
                            className="bg-rose-50 text-rose-700 line-through px-1 py-0.2 rounded border border-rose-200 mx-0.5 opacity-70"
                          >
                            {seg.text}
                          </span>
                        );
                      }
                      return <span key={idx}>{seg.text}</span>;
                    })}
                  </div>
                )}

                {/* View: Side-by-side Table */}
                {viewMode === 'sideBySide' && (
                  <div className="border border-gray-200 rounded-md overflow-hidden text-xs bg-white">
                    <div className="grid grid-cols-2 bg-gray-50 border-b border-gray-200 font-bold text-gray-600 p-2">
                      <div>Original</div>
                      <div>Paraphrased</div>
                    </div>
                    <div className="grid grid-cols-2 p-3 gap-3 text-gray-800 leading-relaxed whitespace-pre-wrap">
                      <div className="border-r border-gray-100 pr-3">{sourceText}</div>
                      <div className="pl-1 text-indigo-900">{activeParaphrasedText}</div>
                    </div>
                  </div>
                )}

                {/* Summary of Changes */}
                {summaryOfChanges && (
                  <div className="mt-3 p-3 bg-white border border-gray-200 rounded-md space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-[11px] uppercase tracking-wider">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>Summary of Changes</span>
                    </div>

                    {summaryOfChanges.structuralShift && (
                      <p className="text-gray-700">
                        <strong className="text-gray-900">Structural Shift:</strong>{' '}
                        {summaryOfChanges.structuralShift}
                      </p>
                    )}

                    {summaryOfChanges.readabilityImpact && (
                      <p className="text-gray-700">
                        <strong className="text-gray-900">Readability Impact:</strong>{' '}
                        {summaryOfChanges.readabilityImpact}
                      </p>
                    )}

                    {summaryOfChanges.keyReplacements && summaryOfChanges.keyReplacements.length > 0 && (
                      <div className="pt-1">
                        <span className="text-gray-500 font-semibold block mb-1">Key Lexical Substitutions:</span>
                        <div className="flex flex-wrap gap-1">
                          {summaryOfChanges.keyReplacements.map((rep, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 text-[11px]"
                            >
                              <span className="line-through text-gray-400">{rep.original}</span>
                              <span className="text-indigo-600 font-bold">→</span>
                              <span className="text-indigo-700 font-semibold">{rep.paraphrased}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Primary Action Button (Docked Bottom Right) */}
          {onParaphrase && (
            <div className="p-3 border-t border-gray-100 bg-white flex items-center justify-between">
              <span className="text-[11px] text-gray-400">
                Click any word in output to explore contextual synonyms
              </span>
              <button
                id="paraphrase-submit-btn"
                type="button"
                disabled={!sourceText.trim() || isLoading}
                onClick={onParaphrase}
                className={`px-6 py-2 rounded-md text-sm font-bold shadow-lg transition-all flex items-center gap-2 ${
                  !sourceText.trim() || isLoading
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 active:scale-95'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>REWRITING...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>REWRITE</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom High-Density Metrics Bar */}
      <footer className="bg-white border border-gray-200 rounded-lg flex flex-wrap items-center px-4 sm:px-6 py-3 justify-between gap-4 shadow-sm">
        {/* Left Metrics Group */}
        <div className="flex items-center gap-6 sm:gap-8">
          {/* Meaning Preservation */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              Meaning Preservation
            </span>
            <div className="flex gap-1 mt-1">
              <div className="w-3 h-1.5 bg-emerald-500 rounded-full"></div>
              <div className="w-3 h-1.5 bg-emerald-500 rounded-full"></div>
              <div className="w-3 h-1.5 bg-emerald-500 rounded-full"></div>
              <div className="w-3 h-1.5 bg-emerald-500 rounded-full"></div>
            </div>
          </div>

          {/* Similarity Score */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              Similarity Score
            </span>
            <span className="text-sm font-mono font-bold text-gray-800">
              {activeParaphrasedText ? `${similarityScore}%` : '—'}
            </span>
          </div>

          {/* Fluency Rating */}
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
              Fluency Rating
            </span>
            <span className="text-sm font-bold text-emerald-600 uppercase tracking-tighter">
              High
            </span>
          </div>

          {/* Word Shift Delta */}
          {activeParaphrasedText && (
            <div className="hidden sm:flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                Length Delta
              </span>
              <span className="text-xs font-semibold text-gray-700 flex items-center gap-1 mt-0.5">
                {wordDiffPercent >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-amber-600" />}
                {wordDiffPercent >= 0 ? `+${wordDiffPercent}%` : `${wordDiffPercent}%`} ({targetMetrics.words} w)
              </span>
            </div>
          )}
        </div>

        {/* Right Quality Guard Checks */}
        <div className="flex items-center gap-4 sm:border-l sm:pl-6 border-gray-200">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={strictEntityLock}
              onChange={(e) => setStrictEntityLock(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-gray-600 font-medium select-none">Strict Named Entity Lock</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={maintainFormatting}
              onChange={(e) => setMaintainFormatting(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs text-gray-600 font-medium select-none">Maintain Formatting</span>
          </label>
        </div>
      </footer>
    </div>
  );
};

