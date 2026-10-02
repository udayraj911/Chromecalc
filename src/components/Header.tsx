import React from 'react';
import { 
  Calculator, 
  Search, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Palette, 
  FolderKanban, 
  PanelRightClose, 
  PanelRightOpen,
  Zap
} from 'lucide-react';
import { ThemeId, Workspace } from '../types';

interface HeaderProps {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace?: (name: string, desc: string) => void;
  onOpenCommandPalette: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  themeId: ThemeId;
  onSelectTheme: (theme: ThemeId) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSettings?: () => void;
  accentColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentWorkspace,
  workspaces,
  onSelectWorkspace,
  onOpenCommandPalette,
  soundEnabled,
  onToggleSound,
  themeId,
  onSelectTheme,
  sidebarOpen,
  onToggleSidebar,
  accentColor
}) => {
  return (
    <header className="w-full bg-slate-900/60 backdrop-blur-xl border-b border-white/10 px-4 py-2.5 flex items-center justify-between z-30 sticky top-0 transition-all">
      {/* Brand & Workspace Switcher */}
      <div className="flex items-center gap-3">
        {/* ChromaCalc Glowing Logo */}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={onOpenCommandPalette}>
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${accentColor}, #ec4899, #a855f7)`,
              boxShadow: `0 0 15px ${accentColor}44` 
            }}
          >
            <Zap size={18} className="text-white fill-white/20" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1">
              ChromaCalc <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-cyan-300 border border-cyan-500/20">PRO</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">AI Calculation Engine</span>
          </div>
        </div>

        {/* Workspace Pill Selector */}
        <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />
        <div className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-300 transition-all cursor-pointer relative group">
          <FolderKanban size={13} className="text-cyan-400" />
          <select 
            value={currentWorkspace.id}
            onChange={(e) => onSelectWorkspace(e.target.value)}
            className="bg-transparent text-xs font-mono text-slate-200 outline-none cursor-pointer pr-1"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id} className="bg-slate-900 text-white">
                Workspace: {ws.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Center Search Palette Trigger */}
      <button
        onClick={onOpenCommandPalette}
        className="flex items-center gap-2 bg-black/40 hover:bg-black/60 border border-white/10 hover:border-cyan-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-inner max-w-xs w-full sm:w-64"
      >
        <Search size={14} className="text-cyan-400" />
        <span className="truncate">Search commands, math, formulas...</span>
        <kbd className="hidden sm:inline-block ml-auto text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-slate-300 border border-white/10">
          ⌘K
        </kbd>
      </button>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher Quick Toggle */}
        <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
          {(['cyberpunk', 'retrowave', 'aurora'] as ThemeId[]).map((tId) => (
            <button
              key={tId}
              onClick={() => onSelectTheme(tId)}
              className={`px-2 py-1 text-[11px] font-mono rounded-md transition-all cursor-pointer capitalize ${
                themeId === tId 
                  ? 'bg-white/15 text-white shadow font-semibold' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tId === 'cyberpunk' ? 'Cyber' : tId === 'retrowave' ? 'Retro' : 'Aurora'}
            </button>
          ))}
        </div>

        {/* Audio Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            soundEnabled 
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20' 
              : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
          }`}
          title={soundEnabled ? 'Mute Tactile Audio Clicks' : 'Enable Tactile Audio Clicks'}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            sidebarOpen 
              ? 'bg-pink-500/15 border-pink-500/40 text-pink-300' 
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
          title={sidebarOpen ? 'Hide Intelligence Sidebar' : 'Show Intelligence Sidebar'}
        >
          {sidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </button>
      </div>
    </header>
  );
};
