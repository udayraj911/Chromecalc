import React, { useState } from 'react';
import { Cpu, Atom, Zap, Search, Send, Calculator, Check } from 'lucide-react';
import { SCIENTIFIC_CONSTANTS, ENGINEERING_FORMULAS } from '../data/constants';

interface EngineeringCalculatorProps {
  onInsertToCalculator: (expr: string) => void;
}

export const EngineeringCalculator: React.FC<EngineeringCalculatorProps> = ({ onInsertToCalculator }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [query, setQuery] = useState('');
  const [selectedFormulaId, setSelectedFormulaId] = useState<string>(ENGINEERING_FORMULAS[0].id);
  const [inputValues, setInputValues] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    ENGINEERING_FORMULAS[0].inputs.forEach(inp => initial[inp.id] = inp.defaultValue);
    return initial;
  });
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);

  const selectedFormula = ENGINEERING_FORMULAS.find(f => f.id === selectedFormulaId) || ENGINEERING_FORMULAS[0];

  const handleSelectFormula = (fId: string) => {
    setSelectedFormulaId(fId);
    const form = ENGINEERING_FORMULAS.find(f => f.id === fId);
    if (form) {
      const vals: Record<string, number> = {};
      form.inputs.forEach(inp => vals[inp.id] = inp.defaultValue);
      setInputValues(vals);
    }
  };

  const formulaResult = selectedFormula.compute(inputValues);

  const categories = ['All', 'Physics', 'Chemistry', 'Electromagnetism', 'Astronomy'];

  const filteredConstants = SCIENTIFIC_CONSTANTS.filter(c => {
    const matchesCat = activeCategory === 'All' || c.category === activeCategory;
    const matchesQuery = !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.symbol.toLowerCase().includes(query.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="flex flex-col bg-slate-900/40 rounded-2xl border border-white/10 p-4 space-y-5">
      {/* Scientific & Engineering Constants Directory */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
            <Atom size={15} className="text-cyan-400" /> Scientific & Engineering Constants
          </h3>

          <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 focus-within:border-cyan-500/50 transition-all">
            <Search size={13} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search constants (e.g., Avogadro, Planck)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-slate-500 outline-none font-mono w-36 sm:w-48"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-slate-500 hover:text-white text-xs">×</button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Constants List */}
        <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
          {filteredConstants.length === 0 ? (
            <div className="p-4 text-center text-xs font-mono text-slate-400 bg-white/5 rounded-xl">
              No constants matching "{query}"
            </div>
          ) : (
            filteredConstants.map((c) => (
              <div
                key={c.symbol}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 flex items-center justify-between text-xs font-mono transition-all group"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-cyan-400 font-mono font-extrabold text-sm px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/20">
                      {c.symbol}
                    </span>
                    <span className="text-slate-200 text-xs font-medium truncate">{c.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-2">
                    <span className="text-slate-300 font-semibold">{c.value.toExponential(5)}</span>
                    <span className="text-slate-500 text-[10px]">{c.unit}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onInsertToCalculator(c.value.toString());
                    setCopiedSymbol(c.symbol);
                    setTimeout(() => setCopiedSymbol(null), 1200);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    copiedSymbol === c.symbol
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 shadow-sm'
                  }`}
                  title={`Insert ${c.name} (${c.value}) into main calculator LCD`}
                >
                  {copiedSymbol === c.symbol ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span>Inserted!</span>
                    </>
                  ) : (
                    <>
                      <Send size={12} />
                      <span>Insert to LCD</span>
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Formula Solver Section */}
      <div className="space-y-3 border-t border-white/10 pt-4">
        <h3 className="text-xs font-mono text-purple-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
          <Zap size={14} /> Interactive Engineering Formulas
        </h3>

        {/* Formula Selector Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {ENGINEERING_FORMULAS.map((f) => (
            <button
              key={f.id}
              onClick={() => handleSelectFormula(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                selectedFormulaId === f.id
                  ? 'bg-purple-500/20 border border-purple-500/40 text-purple-300 font-bold'
                  : 'bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.title}
            </button>
          ))}
        </div>

        {/* Active Formula Card */}
        <div className="bg-slate-950/80 rounded-xl border border-white/10 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white font-mono">{selectedFormula.title}</span>
            <span className="text-[11px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              {selectedFormula.formulaDisplay}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedFormula.inputs.map((inp) => (
              <div key={inp.id}>
                <label className="text-[11px] font-mono text-slate-400 flex justify-between">
                  <span>{inp.label}</span>
                  <span className="text-purple-300 font-bold">{inputValues[inp.id] ?? inp.defaultValue} {inp.unit}</span>
                </label>
                <input
                  type="number"
                  value={inputValues[inp.id] ?? inp.defaultValue}
                  onChange={(e) => setInputValues({ ...inputValues, [inp.id]: Number(e.target.value) })}
                  className="w-full mt-1 px-3 py-1.5 bg-black/50 border border-white/10 rounded-lg text-xs font-mono text-white outline-none"
                />
              </div>
            ))}
          </div>

          {/* Computed Output */}
          <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 flex items-center justify-between font-mono">
            <div>
              <div className="text-[10px] text-purple-400">Calculated Result</div>
              <div className="text-sm font-bold text-white">
                {formulaResult.result} {formulaResult.unit}
              </div>
            </div>
            <button
              onClick={() => onInsertToCalculator(formulaResult.result.toString())}
              className="px-3 py-1 bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer font-bold"
            >
              <Calculator size={12} /> Insert to LCD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
