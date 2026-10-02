import React, { useState } from 'react';
import { Brain, Sparkles, Send, RefreshCw, Calculator, Copy, Check } from 'lucide-react';
import Markdown from 'react-markdown';

interface BrainAssistantProps {
  onInsertToCalculator: (expr: string) => void;
  currentInput: string;
}

export const BrainAssistant: React.FC<BrainAssistantProps> = ({ onInsertToCalculator, currentInput }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const quickChips = [
    `Solve & explain: ${currentInput || '25% of 850 + 12'}`,
    "Explain Pythagorean theorem with steps",
    "How does compound interest work formula wise?",
    "Derive quadratic formula x = (-b ± √(b² - 4ac)) / 2a"
  ];

  const handleAskBrain = async (textToAsk?: string) => {
    const q = textToAsk || prompt;
    if (!q.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/thinking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: q }]
        })
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setResponse(data.text);
      } else {
        setResponse("Error: Brain reasoning system failed to generate response.");
      }
    } catch (err: any) {
      console.error(err);
      setResponse("Error: Brain network service unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-white/10 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Brain size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
              Brain Mode <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30">Gemini 3.1 Reasoning</span>
            </h3>
            <p className="text-xs text-slate-400 font-mono">Deep step-by-step logic, formula derivation, & problem verifier</p>
          </div>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => {
              setPrompt(chip);
              handleAskBrain(chip);
            }}
            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-purple-500/20 border border-white/10 text-xs text-slate-300 hover:text-white transition-all cursor-pointer whitespace-nowrap shrink-0 font-mono"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Ask complex math, physics, or homework problem..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAskBrain()}
          className="w-full px-3 py-2 bg-black/50 border border-white/10 focus:border-purple-500/50 rounded-xl text-xs font-mono text-white outline-none"
        />
        <button
          onClick={() => handleAskBrain()}
          disabled={loading || !prompt.trim()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
          <span>Reason</span>
        </button>
      </div>

      {/* Thinking Response Canvas */}
      <div className="flex-1 min-h-[160px] bg-black/60 rounded-xl border border-white/10 p-3 overflow-y-auto font-mono text-xs text-slate-200">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-purple-400 gap-2">
            <Sparkles size={24} className="animate-spin" />
            <span className="text-xs font-mono animate-pulse">Deep reasoning engine analyzing problem step by step...</span>
          </div>
        ) : response ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] text-purple-400 uppercase tracking-wider font-bold">Step-by-Step Breakdown</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(response);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="prose prose-invert max-w-none text-xs leading-relaxed">
              <Markdown>{response}</Markdown>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8 text-slate-500 text-center gap-2">
            <Brain size={28} className="opacity-40" />
            <p className="text-xs">Type any complex problem or click a prompt chip above to begin deep reasoning.</p>
          </div>
        )}
      </div>
    </div>
  );
};
