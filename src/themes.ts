import { ThemeConfig } from './types';

export const THEMES: Record<string, ThemeConfig> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    bgColor: 'bg-slate-950 text-white relative min-h-screen flex flex-col justify-center items-center overflow-hidden font-sans sm:p-4 p-0 selection:bg-cyan-500/30',
    calculatorBg: 'bg-slate-900/80 backdrop-blur-xl border-x-0 sm:border border-y sm:border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.15)] sm:rounded-3xl rounded-none w-full sm:max-w-sm overflow-hidden flex flex-col relative z-20 transition-all duration-300',
    displayBg: 'bg-black/70 sm:border border-cyan-500/25 shadow-inner sm:rounded-2xl rounded-none p-5 mb-4 flex flex-col items-end relative overflow-hidden',
    buttonClass: {
      number: 'bg-slate-800/60 hover:bg-slate-700/70 active:bg-slate-600/80 border border-slate-700/50 text-cyan-400 font-sans text-2xl font-semibold cursor-pointer relative overflow-hidden transition-all duration-150 active:scale-95 shadow-sm rounded-2xl py-4 flex justify-center items-center select-none',
      operator: 'bg-pink-950/30 hover:bg-pink-900/50 active:bg-pink-800/60 border border-pink-500/40 text-pink-400 font-sans text-2xl font-bold cursor-pointer relative overflow-hidden transition-all duration-150 active:scale-95 rounded-2xl py-4 flex justify-center items-center select-none',
      special: 'bg-violet-950/30 hover:bg-violet-900/50 active:bg-violet-800/60 border border-violet-500/30 text-violet-300 font-sans text-lg font-medium cursor-pointer relative overflow-hidden transition-all duration-150 active:scale-95 rounded-2xl py-4 flex justify-center items-center select-none'
    },
    textColor: {
      primary: 'text-cyan-400 font-mono text-4xl font-bold truncate tracking-wider leading-none',
      secondary: 'text-cyan-500/60 font-mono text-sm h-5 truncate font-medium',
      accent: 'text-pink-400'
    },
    accentColor: '#ec4899',
    particleColors: ['#06b6d4', '#ec4899', '#d946ef', '#a855f7'],
    audioClickType: 'sine'
  },
  retrowave: {
    id: 'retrowave',
    name: 'Retro Sunset',
    bgColor: 'bg-neutral-950 text-orange-200 relative min-h-screen flex flex-col justify-center items-center overflow-hidden font-sans sm:p-4 p-0 bg-[linear-gradient(rgba(244,63,94,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(244,63,94,0.04)_1px,transparent_1px)] bg-[size:24px_24px] selection:bg-orange-500/30',
    calculatorBg: 'bg-neutral-900/85 backdrop-blur-xl border-x-0 sm:border border-y sm:border-orange-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] sm:rounded-3xl rounded-none w-full sm:max-w-sm overflow-hidden flex flex-col relative z-20 transition-all duration-300',
    displayBg: 'bg-neutral-950/90 sm:border border-amber-500/20 shadow-inner sm:rounded-2xl rounded-none p-5 mb-4 flex flex-col items-end relative overflow-hidden',
    buttonClass: {
      number: 'bg-stone-800/80 hover:bg-stone-700/80 active:bg-stone-600 border border-stone-700/60 text-amber-200 font-sans text-2xl font-semibold cursor-pointer relative overflow-hidden transition-all duration-150 active:scale-95 shadow-sm rounded-2xl py-4 flex justify-center items-center select-none',
      operator: 'bg-orange-500/15 hover:bg-orange-500/30 active:bg-orange-500/40 border border-orange-500/40 text-orange-400 font-sans text-2xl font-bold cursor-pointer relative overflow-hidden transition-all duration-150 active:scale-95 rounded-2xl py-4 flex justify-center items-center select-none',
      special: 'bg-rose-500/15 hover:bg-rose-500/30 active:bg-rose-500/40 border border-rose-500/30 text-rose-300 font-sans text-lg font-medium cursor-pointer relative overflow-hidden transition-all duration-150 active:scale-95 rounded-2xl py-4 flex justify-center items-center select-none'
    },
    textColor: {
      primary: 'text-orange-400 font-mono text-4xl font-bold truncate tracking-wider leading-none',
      secondary: 'text-orange-500/60 font-mono text-sm h-5 truncate font-medium',
      accent: 'text-rose-400'
    },
    accentColor: '#f59e0b',
    particleColors: ['#f59e0b', '#f43f5e', '#ef4444', '#fb7185'],
    audioClickType: 'triangle'
  },
  aurora: {
    id: 'aurora',
    name: 'Aurora Arctic',
    bgColor: 'bg-slate-50 text-slate-800 relative min-h-screen flex flex-col justify-center items-center overflow-hidden font-sans sm:p-4 p-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.08),transparent_50%)] selection:bg-emerald-500/20',
    calculatorBg: 'bg-white/80 backdrop-blur-xl border-x-0 sm:border border-y sm:border-emerald-100/80 shadow-[0_20px_50px_rgba(16,185,129,0.08)] sm:rounded-3xl rounded-none w-full sm:max-w-sm overflow-hidden flex flex-col relative z-20 transition-all duration-300',
    displayBg: 'bg-slate-100/60 sm:border border-emerald-100 shadow-inner sm:rounded-2xl rounded-none p-5 mb-4 flex flex-col items-end relative overflow-hidden',
    buttonClass: {
      number: 'bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200/50 text-slate-700 font-sans text-2xl font-semibold cursor-pointer relative overflow-hidden transition-all duration-150 active:scale-95 shadow-sm rounded-2xl py-4 flex justify-center items-center select-none',
      operator: 'bg-emerald-50/70 hover:bg-emerald-100/80 active:bg-emerald-200/90 border border-emerald-200 text-emerald-600 font-sans text-2xl font-bold cursor-pointer relative overflow-hidden transition-all duration-150 active:scale-95 rounded-2xl py-4 flex justify-center items-center select-none',
      special: 'bg-teal-50/60 hover:bg-teal-100/70 active:bg-teal-200/80 border border-teal-200/50 text-teal-600 font-sans text-lg font-medium cursor-pointer relative overflow-hidden transition-all duration-150 active:scale-95 rounded-2xl py-4 flex justify-center items-center select-none'
    },
    textColor: {
      primary: 'text-emerald-700 font-mono text-4xl font-bold truncate tracking-normal leading-none',
      secondary: 'text-slate-400 font-mono text-sm h-5 truncate font-medium',
      accent: 'text-teal-600'
    },
    accentColor: '#10b981',
    particleColors: ['#10b981', '#06b6d4', '#14b8a6', '#34d399'],
    audioClickType: 'sine'
  }
};
