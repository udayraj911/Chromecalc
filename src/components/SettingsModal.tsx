import React from 'react';
import { Settings, Palette, Volume2, VolumeX, Sparkles, Check, RefreshCw } from 'lucide-react';
import { ThemeId } from '../types';

interface SettingsModalProps {
  themeId: ThemeId;
  onSelectTheme: (t: ThemeId) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  accentColor: string;
  onClearData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  themeId,
  onSelectTheme,
  soundEnabled,
  onToggleSound,
  accentColor,
  onClearData
}) => {
  return (
    <div className="flex flex-col bg-slate-900/40 rounded-2xl border border-white/10 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-white/10">
            <Settings size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">ChromaCalc Preferences</h3>
            <p className="text-xs text-slate-400 font-mono">Themes, audio, haptics, and system data</p>
          </div>
        </div>
      </div>

      {/* Theme Selection */}
      <div className="space-y-2">
        <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
          <Palette size={14} className="text-cyan-400" /> Active Visual Theme
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'Deep void black with electric cyan & neon pink accent', color: '#06b6d4' },
            { id: 'retrowave', name: 'Retro Sunset', desc: '80s synthwave sunset with magenta & warm amber glow', color: '#ec4899' },
            { id: 'aurora', name: 'Aurora Arctic', desc: 'Subtle frosted ice canvas with deep emerald aurora', color: '#10b981' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTheme(t.id as ThemeId)}
              className={`p-3 rounded-xl border text-left font-mono transition-all cursor-pointer ${
                themeId === t.id
                  ? 'bg-white/15 border-cyan-500 text-white shadow-lg'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{t.name}</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">{t.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Sound & Feedback */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <label className="text-xs font-mono font-bold text-slate-300">Tactile Audio & Feedback</label>
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-white/10">
          <div>
            <div className="text-xs font-bold text-white font-mono">Keypad Audio Click Synthesizer</div>
            <div className="text-[10px] text-slate-400 font-mono">WebAudio synthesized click pulse on button press</div>
          </div>
          <button
            onClick={onToggleSound}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-white/5 border-white/10 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Clear Storage */}
      <div className="pt-2 border-t border-white/10">
        <button
          onClick={onClearData}
          className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
        >
          Reset ChromaCalc Storage & App State
        </button>
      </div>
    </div>
  );
};
