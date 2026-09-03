import React, { useEffect, useState } from 'react';
import { Sparkles, X, ArrowRight, Loader2 } from 'lucide-react';

interface SynonymAlternative {
  text: string;
  formality: string;
  nuance: string;
}

interface SynonymModalProps {
  word: string;
  sentenceContext: string;
  tone: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectReplacement: (newWord: string) => void;
}

export const SynonymModal: React.FC<SynonymModalProps> = ({
  word,
  sentenceContext,
  tone,
  isOpen,
  onClose,
  onSelectReplacement,
}) => {
  const [loading, setLoading] = useState(false);
  const [alternatives, setAlternatives] = useState<SynonymAlternative[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !word.trim()) return;

    let isMounted = true;
    setLoading(true);
    setError(null);
    setAlternatives([]);

    fetch('/api/synonyms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, sentence: sentenceContext, tone }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error || `Server responded with ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.data?.alternatives) {
          setAlternatives(data.data.alternatives);
        } else {
          setError(data.error || 'Could not fetch alternatives');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        let msg = err.message || 'Network error';
        if (msg === 'Failed to fetch' || msg.includes('fetch')) {
          msg = 'Unable to connect to synonym service. Please try again.';
        }
        setError(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, word, sentenceContext, tone]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-gray-200 rounded-xl w-full max-w-md p-5 shadow-2xl text-gray-800 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Contextual Synonyms</h3>
            <p className="text-xs text-gray-500">
              Target term: <span className="text-indigo-600 font-semibold font-mono">"{word}"</span>
            </p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            <span>Finding natural contextual alternatives...</span>
          </div>
        ) : error ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
            {error}
          </div>
        ) : alternatives.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-400">
            No direct replacements found for this word.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {alternatives.map((alt, idx) => (
              <button
                key={idx}
                id={`synonym-alt-${idx}`}
                type="button"
                onClick={() => {
                  onSelectReplacement(alt.text);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-lg bg-gray-50 hover:bg-indigo-50/70 border border-gray-200 hover:border-indigo-300 transition group flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-gray-900 group-hover:text-indigo-700">
                      {alt.text}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-gray-600 font-medium border border-gray-200">
                      {alt.formality}
                    </span>
                  </div>
                  {alt.nuance && (
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {alt.nuance}
                    </p>
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center justify-between">
          <span>Click an alternative to replace in your text</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

