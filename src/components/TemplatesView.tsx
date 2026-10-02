import React, { useState } from 'react';
import { FileText, Calculator, ArrowRight, Check } from 'lucide-react';
import { SMART_TEMPLATES } from '../data/templates';
import { SmartTemplate } from '../types';

interface TemplatesViewProps {
  onInsertToCalculator: (expr: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onInsertToCalculator }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<SmartTemplate>(SMART_TEMPLATES[0]);
  const [formValues, setFormValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    SMART_TEMPLATES[0].fields.forEach(f => {
      init[f.id] = typeof f.defaultValue === 'number' ? f.defaultValue : Number(f.defaultValue) || 0;
    });
    return init;
  });

  const handleSelectTemplate = (template: SmartTemplate) => {
    setSelectedTemplate(template);
    const init: Record<string, number> = {};
    template.fields.forEach(f => {
      init[f.id] = typeof f.defaultValue === 'number' ? f.defaultValue : Number(f.defaultValue) || 0;
    });
    setFormValues(init);
  };

  const computedResult = selectedTemplate.compute(formValues);

  return (
    <div className="flex flex-col bg-slate-900/40 rounded-2xl border border-white/10 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <FileText size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Smart Calculation Templates</h3>
            <p className="text-xs text-slate-400 font-mono">Pre-configured calculation models for budgets, tax, construction, & homework</p>
          </div>
        </div>
      </div>

      {/* Template selector pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {SMART_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => handleSelectTemplate(tmpl)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
              selectedTemplate.id === tmpl.id
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold shadow'
                : 'bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tmpl.title}
          </button>
        ))}
      </div>

      {/* Active Template Interactive Form */}
      <div className="bg-slate-950/80 rounded-xl border border-white/10 p-4 space-y-4 font-mono">
        <div>
          <h4 className="text-sm font-bold text-amber-300">{selectedTemplate.title}</h4>
          <p className="text-xs text-slate-400 mt-0.5">{selectedTemplate.description}</p>
        </div>

        {/* Dynamic Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selectedTemplate.fields.map((field) => (
            <div key={field.id}>
              <label className="text-xs text-slate-300 flex justify-between">
                <span>{field.label}</span>
                {field.unit && <span className="text-amber-400 font-bold">{field.unit}</span>}
              </label>
              <input
                type="number"
                value={formValues[field.id] ?? field.defaultValue}
                onChange={(e) => setFormValues({ ...formValues, [field.id]: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-1.5 bg-black/50 border border-white/10 focus:border-amber-500/50 rounded-lg text-xs font-mono text-white outline-none"
              />
            </div>
          ))}
        </div>

        {/* Calculation Result & Breakdown */}
        <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-400 font-bold uppercase">Template Calculation Result</span>
            <span className="text-base font-bold text-white">{computedResult.result}</span>
          </div>

          <div className="space-y-1 border-t border-white/10 pt-2 text-xs">
            {computedResult.breakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between text-slate-300">
                <span>{item.label}</span>
                <span className="font-bold text-amber-300">{item.value}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => onInsertToCalculator(computedResult.expression)}
            className="w-full mt-2 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Calculator size={14} /> Send Formula to Calculator Display
          </button>
        </div>
      </div>
    </div>
  );
};
