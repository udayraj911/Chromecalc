import React from 'react';
import { 
  Home, 
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
  ChevronRight, 
  X,
  Sparkles,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { SidebarSection, HistoryItem, Workspace } from '../types';
import { BrainAssistant } from './BrainAssistant';
import { LensScanner } from './LensScanner';
import { GraphPlotter } from './GraphPlotter';
import { FinanceCalculator } from './FinanceCalculator';
import { EngineeringCalculator } from './EngineeringCalculator';
import { ConverterView } from './ConverterView';
import { SmartHistory } from './SmartHistory';
import { WorkspacesManager } from './WorkspacesManager';
import { TemplatesView } from './TemplatesView';
import { SettingsModal } from './SettingsModal';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: SidebarSection;
  onSelectSection: (section: SidebarSection) => void;
  onInsertToCalculator: (expr: string) => void;
  currentInput: string;
  history: HistoryItem[];
  onToggleStar: (id: string) => void;
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string, desc: string) => void;
  onUpdateWorkspaceNotes: (id: string, notes: string) => void;
  onUpdateContextMemory: (id: string, memory: Record<string, string | number>) => void;
  onDeleteWorkspace: (id: string) => void;
  themeId: any;
  onSelectTheme: any;
  soundEnabled: boolean;
  onToggleSound: () => void;
  accentColor: string;
  chatMessages: { role: 'user' | 'model'; content: string }[];
  onSendMessage: (msg: string) => void;
  chatLoading: boolean;
  liveVoiceActive: boolean;
  onToggleVoice: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeSection,
  onSelectSection,
  onInsertToCalculator,
  currentInput,
  history,
  onToggleStar,
  onDeleteHistoryItem,
  onClearHistory,
  workspaces,
  currentWorkspace,
  onSelectWorkspace,
  onCreateWorkspace,
  onUpdateWorkspaceNotes,
  onUpdateContextMemory,
  onDeleteWorkspace,
  themeId,
  onSelectTheme,
  soundEnabled,
  onToggleSound,
  accentColor,
  chatMessages,
  onSendMessage,
  chatLoading,
  liveVoiceActive,
  onToggleVoice
}) => {
  const navGroups = [
    {
      title: 'Workspace',
      items: [
        { id: 'home', label: 'Home Overview', icon: Home },
        { id: 'calculator', label: 'Main Calculator', icon: Calculator },
      ]
    },
    {
      title: 'AI Intelligence',
      items: [
        { id: 'brain', label: 'Brain Mode', icon: Brain, badge: 'Thinking' },
        { id: 'chat', label: 'AI Chat', icon: MessageSquare },
        { id: 'voice', label: 'Voice Assistant', icon: Mic, badge: liveVoiceActive ? 'Live' : undefined },
        { id: 'lens', label: 'Lens (OCR Vision)', icon: Camera },
      ]
    },
    {
      title: 'Specialized Tools',
      items: [
        { id: 'graph', label: '2D Graph Plotter', icon: LineChart },
        { id: 'finance', label: 'Financial Engine', icon: DollarSign },
        { id: 'engineering', label: 'Engineering & Constants', icon: Cpu },
        { id: 'converter', label: 'Unit Converter', icon: RefreshCw },
      ]
    },
    {
      title: 'Storage & System',
      items: [
        { id: 'history', label: 'Smart History', icon: History },
        { id: 'favorites', label: 'Starred Favorites', icon: Star },
        { id: 'workspaces', label: 'Workspaces', icon: FolderKanban },
        { id: 'templates', label: 'Templates', icon: FileText },
        { id: 'settings', label: 'Preferences', icon: Settings },
      ]
    }
  ];

  const [chatInput, setChatInput] = React.useState('');

  const handleSendChatMessage = () => {
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  if (!isOpen) return null;

  return (
    <aside className="w-full lg:w-[480px] h-full bg-slate-900/90 backdrop-blur-2xl border-l border-white/10 flex flex-col z-20 transition-all shadow-2xl relative">
      {/* Sidebar Header */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-cyan-400" />
          <span className="text-xs font-bold font-mono text-white tracking-wide uppercase">
            Intelligence Sidebar
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Sidebar Section Navigation Chips */}
      <div className="px-3 py-2 border-b border-white/10 bg-slate-950/60 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1">
          {navGroups.flatMap(g => g.items).map((item) => {
            const IconComp = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id as SidebarSection)}
                className={`flex items-center gap-1.5 px-2.5 py-1.2 rounded-lg text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold shadow'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconComp size={13} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1 rounded font-bold ${
                    item.badge === 'Live' ? 'bg-red-500 text-white animate-pulse' : 'bg-purple-500/30 text-purple-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area inside Sidebar */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        
        {/* 🏠 HOME SECTION OVERVIEW */}
        {activeSection === 'home' && (
          <div className="space-y-4 font-mono">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 via-slate-900 to-purple-950/60 border border-cyan-500/30 space-y-2">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Zap size={16} /> ChromaCalc Intelligence Layer
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Welcome to ChromaCalc! Your calculator stays active on the workspace at all times. Explore specialized engines below:
              </p>
            </div>

            {/* Quick Feature Grid */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onSelectSection('brain')}
                className="p-3 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 text-left transition-all cursor-pointer group"
              >
                <Brain size={20} className="text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">Brain Mode</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Deep reasoning solver</div>
              </button>

              <button
                onClick={() => onSelectSection('graph')}
                className="p-3 rounded-xl bg-white/5 hover:bg-cyan-500/20 border border-white/10 hover:border-cyan-500/30 text-left transition-all cursor-pointer group"
              >
                <LineChart size={20} className="text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">2D Graph Plotter</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Function visualizer</div>
              </button>

              <button
                onClick={() => onSelectSection('finance')}
                className="p-3 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-left transition-all cursor-pointer group"
              >
                <DollarSign size={20} className="text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">Finance Engine</div>
                <div className="text-[10px] text-slate-400 mt-0.5">EMI, SIP, Tax, ROI</div>
              </button>

              <button
                onClick={() => onSelectSection('lens')}
                className="p-3 rounded-xl bg-white/5 hover:bg-pink-500/20 border border-white/10 hover:border-pink-500/30 text-left transition-all cursor-pointer group"
              >
                <Camera size={20} className="text-pink-400 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-bold text-white">Lens OCR</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Scan homework & bills</div>
              </button>
            </div>
          </div>
        )}

        {/* 🧮 CALCULATOR TIPS VIEW */}
        {activeSection === 'calculator' && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3 font-mono text-xs text-slate-300">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Calculator size={16} className="text-cyan-400" /> Main Calculator Workspace Active
            </h3>
            <p>Your main calculator is always open on the central stage! Key features available:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Scientific Keypad toggle (sin, cos, tan, log, sqrt, pi, power)</li>
              <li>Tactile Audio Synthesizer sound clicks</li>
              <li>Undo / Redo history state stack</li>
              <li>Particle explosion animation on equal press</li>
            </ul>
          </div>
        )}

        {/* 🧠 BRAIN MODE */}
        {activeSection === 'brain' && (
          <BrainAssistant onInsertToCalculator={onInsertToCalculator} currentInput={currentInput} />
        )}

        {/* 💬 AI CHAT */}
        {activeSection === 'chat' && (
          <div className="flex flex-col h-[500px] bg-slate-900/40 rounded-2xl border border-white/10 p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs font-bold text-cyan-300 font-mono flex items-center gap-1.5">
                <MessageSquare size={14} /> Natural Language Calculation Assistant
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-cyan-600/30 border border-cyan-500/40 text-white ml-auto'
                      : 'bg-white/5 border border-white/10 text-slate-200 mr-auto'
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {chatLoading && <div className="text-xs text-cyan-400 animate-pulse font-mono">Assistant calculating...</div>}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask e.g. '25% of 850', 'split $120 bill between 4 friends'..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white outline-none"
              />
              <button
                onClick={handleSendChatMessage}
                className="px-3 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* 🎤 VOICE MODE */}
        {activeSection === 'voice' && (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-4 font-mono text-center">
            <div className="p-3 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 w-16 h-16 mx-auto flex items-center justify-center animate-pulse">
              <Mic size={32} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gemini Live Voice Engine</h3>
              <p className="text-xs text-slate-400 mt-1">Speak calculations naturally e.g. "What's 15% tip on 85 dollars?"</p>
            </div>
            <button
              onClick={onToggleVoice}
              className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                liveVoiceActive
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
              }`}
            >
              {liveVoiceActive ? 'Stop Live Voice Session' : 'Start Live Voice Session'}
            </button>
          </div>
        )}

        {/* 📷 LENS MODE */}
        {activeSection === 'lens' && (
          <LensScanner onInsertToCalculator={onInsertToCalculator} />
        )}

        {/* 📈 GRAPH PLOTTER */}
        {activeSection === 'graph' && (
          <GraphPlotter onInsertToCalculator={onInsertToCalculator} accentColor={accentColor} />
        )}

        {/* 📊 FINANCE MODE */}
        {activeSection === 'finance' && (
          <FinanceCalculator onInsertToCalculator={onInsertToCalculator} />
        )}

        {/* 📐 ENGINEERING MODE */}
        {activeSection === 'engineering' && (
          <EngineeringCalculator onInsertToCalculator={onInsertToCalculator} />
        )}

        {/* 🔁 CONVERTER VIEW */}
        {activeSection === 'converter' && (
          <ConverterView onInsertToCalculator={onInsertToCalculator} />
        )}

        {/* 📜 SMART HISTORY */}
        {activeSection === 'history' && (
          <SmartHistory
            history={history}
            onInsertToCalculator={onInsertToCalculator}
            onToggleStar={onToggleStar}
            onDeleteHistoryItem={onDeleteHistoryItem}
            onClearHistory={onClearHistory}
          />
        )}

        {/* ⭐ FAVORITES */}
        {activeSection === 'favorites' && (
          <SmartHistory
            history={history.filter(h => h.starred)}
            onInsertToCalculator={onInsertToCalculator}
            onToggleStar={onToggleStar}
            onDeleteHistoryItem={onDeleteHistoryItem}
            onClearHistory={onClearHistory}
          />
        )}

        {/* 📂 WORKSPACES */}
        {activeSection === 'workspaces' && (
          <WorkspacesManager
            workspaces={workspaces}
            currentWorkspace={currentWorkspace}
            onSelectWorkspace={onSelectWorkspace}
            onCreateWorkspace={onCreateWorkspace}
            onUpdateWorkspaceNotes={onUpdateWorkspaceNotes}
            onUpdateContextMemory={onUpdateContextMemory}
            onDeleteWorkspace={onDeleteWorkspace}
            onInsertToCalculator={onInsertToCalculator}
          />
        )}

        {/* 📋 TEMPLATES */}
        {activeSection === 'templates' && (
          <TemplatesView onInsertToCalculator={onInsertToCalculator} />
        )}

        {/* ⚙ SETTINGS */}
        {activeSection === 'settings' && (
          <SettingsModal
            themeId={themeId}
            onSelectTheme={onSelectTheme}
            soundEnabled={soundEnabled}
            onToggleSound={onToggleSound}
            accentColor={accentColor}
            onClearData={onClearHistory}
          />
        )}

      </div>
    </aside>
  );
};
