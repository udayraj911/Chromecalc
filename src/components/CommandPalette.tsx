import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calculator, 
  Brain, 
  MessageSquare, 
  Mic, 
  Camera, 
  LineChart, 
  DollarSign, 
  Cpu, 
  RefreshCw, 
  History, 
  Star, 
  FolderKanban, 
  FileText, 
  Settings, 
  ArrowRight,
  Sparkles,
  Zap,
  X
} from 'lucide-react';
import { SidebarSection, HistoryItem, Workspace, ScientificConstant } from '../types';
import { SCIENTIFIC_CONSTANTS } from '../data/constants';
import { SMART_TEMPLATES } from '../data/templates';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (section: SidebarSection) => void;
  onInsertToCalculator: (expr: string) => void;
  history: HistoryItem[];
  workspaces: Workspace[];
  onSelectWorkspace: (id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectSection,
  onInsertToCalculator,
  history,
  workspaces,
  onSelectWorkspace
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
          // open palette
          onClose(); // toggle
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navigationItems = [
    { id: 'calculator', name: 'Main Calculator', icon: Calculator, section: 'calculator' as SidebarSection, cat: 'Modes' },
    { id: 'brain', name: 'Brain Mode (AI Reasoning)', icon: Brain, section: 'brain' as SidebarSection, cat: 'AI' },
    { id: 'chat', name: 'AI Calculation Assistant', icon: MessageSquare, section: 'chat' as SidebarSection, cat: 'AI' },
    { id: 'voice', name: 'Voice Mode', icon: Mic, section: 'voice' as SidebarSection, cat: 'AI' },
    { id: 'lens', name: 'Lens (OCR Vision Scanner)', icon: Camera, section: 'lens' as SidebarSection, cat: 'AI' },
    { id: 'graph', name: 'Interactive Graph Plotter', icon: LineChart, section: 'graph' as SidebarSection, cat: 'Tools' },
    { id: 'finance', name: 'Financial Calculator (EMI, SIP, Tax)', icon: DollarSign, section: 'finance' as SidebarSection, cat: 'Tools' },
    { id: 'engineering', name: 'Engineering & Constants', icon: Cpu, section: 'engineering' as SidebarSection, cat: 'Tools' },
    { id: 'converter', name: 'Unit Converter', icon: RefreshCw, section: 'converter' as SidebarSection, cat: 'Tools' },
    { id: 'history', name: 'Smart Calculation History', icon: History, section: 'history' as SidebarSection, cat: 'Storage' },
    { id: 'workspaces', name: 'Workspaces Manager', icon: FolderKanban, section: 'workspaces' as SidebarSection, cat: 'Storage' },
    { id: 'templates', name: 'Smart Calculation Templates', icon: FileText, section: 'templates' as SidebarSection, cat: 'Storage' },
    { id: 'settings', name: 'System Settings & Themes', icon: Settings, section: 'settings' as SidebarSection, cat: 'System' },
  ];

  const qLower = query.toLowerCase().trim();

  // Filtered items
  const filteredNav = navigationItems.filter(i => 
    i.name.toLowerCase().includes(qLower) || i.cat.toLowerCase().includes(qLower)
  );

  const filteredHistory = history.filter(h => 
    h.expression.toLowerCase().includes(qLower) || h.result.toLowerCase().includes(qLower) || (h.title && h.title.toLowerCase().includes(qLower))
  ).slice(0, 4);

  const filteredConstants = SCIENTIFIC_CONSTANTS.filter(c => 
    c.name.toLowerCase().includes(qLower) || c.symbol.toLowerCase().includes(qLower)
  ).slice(0, 4);

  const filteredTemplates = SMART_TEMPLATES.filter(t => 
    t.title.toLowerCase().includes(qLower) || t.description.toLowerCase().includes(qLower)
  ).slice(0, 3);

  // Is query math?
  const looksLikeMath = qLower.length > 0 && /^[\d\s\+\-\*\/\^\(\)\.\%a-z]+$/.test(qLower) && !navigationItems.some(n => n.name.toLowerCase() === qLower);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-slate-900/90 border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden flex flex-col relative z-50 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-black/40">
          <Search size={20} className="text-cyan-400 shrink-0 animate-pulse" />
          <input
            type="text"
            autoFocus
            placeholder="Search commands, constants, history, or calculate (e.g. '25% of 850')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-white placeholder-slate-500 outline-none font-mono"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Scroll Area */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
          
          {/* Quick Math Calculation Entry */}
          {looksLikeMath && (
            <div className="px-2">
              <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider mb-1 font-semibold px-2">
                Quick Action
              </div>
              <button
                onClick={() => {
                  onInsertToCalculator(query);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-300">
                    <Zap size={18} />
                  </div>
                  <div>
                    <div className="text-sm font-mono font-bold text-cyan-300">Insert into Calculator</div>
                    <div className="text-xs font-mono text-slate-400">{query}</div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-cyan-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {/* Navigation Items */}
          {filteredNav.length > 0 && (
            <div className="px-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-semibold px-2">
                Navigation Commands
              </div>
              <div className="grid grid-cols-1 gap-1">
                {filteredNav.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectSection(item.section);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-cyan-500/20 text-slate-300 group-hover:text-cyan-300 transition-colors">
                          <IconComp size={16} />
                        </div>
                        <span className="text-sm font-medium text-slate-200 group-hover:text-white">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded text-slate-400">
                        {item.cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Constants Search */}
          {filteredConstants.length > 0 && (
            <div className="px-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-semibold px-2">
                Scientific Constants
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {filteredConstants.map((c) => (
                  <button
                    key={c.symbol}
                    onClick={() => {
                      onInsertToCalculator(c.value.toString());
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-purple-900/30 border border-white/5 hover:border-purple-500/30 text-left transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 font-mono">{c.symbol} ({c.name})</div>
                      <div className="text-[11px] font-mono text-purple-300">{c.value} {c.unit}</div>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">Insert</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* History Search */}
          {filteredHistory.length > 0 && (
            <div className="px-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-semibold px-2">
                Calculation History
              </div>
              <div className="space-y-1">
                {filteredHistory.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => {
                      onInsertToCalculator(h.result);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 text-left transition-all cursor-pointer font-mono"
                  >
                    <div>
                      <div className="text-xs text-slate-300">{h.expression}</div>
                      <div className="text-sm font-bold text-cyan-400">= {h.result}</div>
                    </div>
                    <span className="text-[10px] text-slate-500">Use Result</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Templates Search */}
          {filteredTemplates.length > 0 && (
            <div className="px-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1 font-semibold px-2">
                Smart Templates
              </div>
              <div className="space-y-1">
                {filteredTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectSection('templates');
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-yellow-500/10 border border-transparent hover:border-yellow-500/20 text-left transition-all cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-yellow-300">{t.title}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-md">{t.description}</div>
                    </div>
                    <ArrowRight size={14} className="text-yellow-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2 bg-black/60 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-3">
            <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-white">ESC</kbd> Close</span>
            <span><kbd className="bg-white/10 px-1 py-0.5 rounded text-white">⌘K</kbd> Toggle</span>
          </div>
          <div className="text-cyan-400 flex items-center gap-1">
            <Sparkles size={12} /> ChromaCalc Raycast Search
          </div>
        </div>
      </div>
    </div>
  );
};
