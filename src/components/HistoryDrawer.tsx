import React, { useState } from 'react';
import {
  History,
  X,
  Trash2,
  Copy,
  Check,
  ArrowUpRight,
  Search,
  Clock,
} from 'lucide-react';
import { ParaphraseHistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ParaphraseHistoryItem[];
  onRestore: (item: ParaphraseHistoryItem) => void;
  onClearHistory: () => void;
  onDeleteItem: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onRestore,
  onClearHistory,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredHistory = history.filter(
    (item) =>
      item.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.paraphrasedText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-gray-200 shadow-2xl flex flex-col text-gray-800">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Paraphrase History</h3>
                <p className="text-[11px] text-gray-500">
                  {history.length} saved {history.length === 1 ? 'entry' : 'entries'} in local session
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Actions */}
          <div className="p-3 border-b border-gray-100 space-y-2 bg-gray-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search history by text or mode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-md pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            {history.length > 0 && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="inline-flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-medium transition"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear All History</span>
                </button>
              </div>
            )}
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                {searchQuery ? 'No matching history found.' : 'No paraphrases recorded yet.'}
              </div>
            ) : (
              filteredHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 shadow-xs transition group space-y-2"
                >
                  {/* Meta Bar */}
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {item.mode}
                      </span>
                      {item.tone && (
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {item.tone}
                        </span>
                      )}
                    </div>
                    <span className="text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Paraphrased snippet */}
                  <p className="text-xs text-gray-800 line-clamp-3 leading-relaxed">
                    {item.paraphrasedText}
                  </p>

                  {/* Actions */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        onRestore(item);
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Restore to Editor</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.paraphrasedText)}
                        className="p-1 rounded text-gray-400 hover:text-indigo-600 hover:bg-gray-100 transition"
                        title="Copy text"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-gray-100 transition"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

