import React, { useState } from 'react';
import { History, Search, Star, Trash2, Copy, Download, Tag, Edit3, Send, Check } from 'lucide-react';
import { HistoryItem } from '../types';

interface SmartHistoryProps {
  history: HistoryItem[];
  onInsertToCalculator: (expr: string) => void;
  onToggleStar: (id: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
}

export const SmartHistory: React.FC<SmartHistoryProps> = ({
  history,
  onInsertToCalculator,
  onToggleStar,
  onDeleteHistoryItem,
  onClearHistory
}) => {
  const [query, setQuery] = useState('');
  const [filterStarred, setFilterStarred] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHistory = history.filter(item => {
    const matchesQuery = !query || 
      item.expression.toLowerCase().includes(query.toLowerCase()) || 
      item.result.toLowerCase().includes(query.toLowerCase());
    const matchesStar = !filterStarred || item.starred;
    return matchesQuery && matchesStar;
  });

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chromacalc_history_${Date.now()}.json`;
    a.click();
  };

  const exportCSV = () => {
    const headers = 'Expression,Result,Timestamp\n';
    const rows = history.map(h => `"${h.expression}","${h.result}","${new Date(h.timestamp).toLocaleString()}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chromacalc_history_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="flex flex-col bg-slate-900/40 rounded-2xl border border-white/10 p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/30">
            <History size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Searchable History</h3>
            <p className="text-xs text-slate-400 font-mono">Favorite, search, tag, & export your calculation timeline</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={exportCSV}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
          >
            <Download size={12} /> CSV
          </button>
          <button
            onClick={exportJSON}
            className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer"
          >
            <Download size={12} /> JSON
          </button>
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="p-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs transition-all cursor-pointer"
              title="Clear all history"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 flex-1">
          <Search size={14} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search history expressions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder-slate-500 outline-none font-mono"
          />
        </div>

        <button
          onClick={() => setFilterStarred(!filterStarred)}
          className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
            filterStarred
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star size={14} className={filterStarred ? 'fill-amber-400 text-amber-400' : ''} />
          <span>Starred</span>
        </button>
      </div>

      {/* History Items List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-950/80 border border-white/10 hover:border-cyan-500/30 font-mono flex items-center justify-between text-xs transition-all group"
            >
              <div className="space-y-0.5">
                <div className="text-slate-400">{item.expression}</div>
                <div className="text-sm font-bold text-cyan-400 font-mono">= {item.result}</div>
                <div className="text-[10px] text-slate-600">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggleStar(item.id)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-amber-400 transition-colors cursor-pointer"
                  title="Star / Favorite"
                >
                  <Star size={14} className={item.starred ? 'fill-amber-400 text-amber-400' : 'text-slate-500'} />
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(item.result);
                    setCopiedId(item.id);
                    setTimeout(() => setCopiedId(null), 1200);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy result"
                >
                  {copiedId === item.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
                <button
                  onClick={() => onInsertToCalculator(item.result)}
                  className="p-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg transition-colors cursor-pointer"
                  title="Send to Calculator"
                >
                  <Send size={14} />
                </button>
                <button
                  onClick={() => onDeleteHistoryItem(item.id)}
                  className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-slate-500 font-mono text-xs">
            No calculations recorded in history yet.
          </div>
        )}
      </div>
    </div>
  );
};
