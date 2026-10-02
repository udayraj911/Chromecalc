import React, { useState } from 'react';
import { RefreshCw, ArrowRight, Calculator } from 'lucide-react';

interface ConverterViewProps {
  onInsertToCalculator: (expr: string) => void;
}

type UnitCategory = 'length' | 'mass' | 'temperature' | 'speed' | 'data' | 'area';

const UNITS: Record<UnitCategory, { name: string; factorToRatio: Record<string, number> }> = {
  length: {
    name: 'Length',
    factorToRatio: { meters: 1, kilometers: 1000, centimeters: 0.01, feet: 0.3048, inches: 0.0254, miles: 1609.34 }
  },
  mass: {
    name: 'Mass & Weight',
    factorToRatio: { kilograms: 1, grams: 0.001, pounds: 0.453592, ounces: 0.0283495, metricTons: 1000 }
  },
  temperature: {
    name: 'Temperature',
    factorToRatio: { celsius: 1, fahrenheit: 1, kelvin: 1 } // special logic
  },
  speed: {
    name: 'Speed',
    factorToRatio: { 'm/s': 1, 'km/h': 0.277778, mph: 0.44704, knots: 0.514444 }
  },
  data: {
    name: 'Data Storage',
    factorToRatio: { Bytes: 1, Kilobytes: 1024, Megabytes: 1048576, Gigabytes: 1073741824, Terabytes: 1099511627776 }
  },
  area: {
    name: 'Area',
    factorToRatio: { sqMeters: 1, sqFeet: 0.092903, sqKilometers: 1000000, acres: 4046.86, hectares: 10000 }
  }
};

export const ConverterView: React.FC<ConverterViewProps> = ({ onInsertToCalculator }) => {
  const [category, setCategory] = useState<UnitCategory>('length');
  const [value, setValue] = useState<number>(100);
  const [fromUnit, setFromUnit] = useState<string>('meters');
  const [toUnit, setToUnit] = useState<string>('feet');

  const unitList = Object.keys(UNITS[category].factorToRatio);

  const convertUnits = () => {
    if (category === 'temperature') {
      if (fromUnit === 'celsius' && toUnit === 'fahrenheit') return (value * 9/5) + 32;
      if (fromUnit === 'fahrenheit' && toUnit === 'celsius') return (value - 32) * 5/9;
      if (fromUnit === 'celsius' && toUnit === 'kelvin') return value + 273.15;
      if (fromUnit === 'kelvin' && toUnit === 'celsius') return value - 273.15;
      if (fromUnit === 'fahrenheit' && toUnit === 'kelvin') return (value - 32) * 5/9 + 273.15;
      return value;
    }

    const ratios = UNITS[category].factorToRatio;
    const baseInMeters = value * (ratios[fromUnit] || 1);
    const result = baseInMeters / (ratios[toUnit] || 1);
    return Number(result.toFixed(4));
  };

  const outputValue = convertUnits();

  const handleCategoryChange = (cat: UnitCategory) => {
    setCategory(cat);
    const keys = Object.keys(UNITS[cat].factorToRatio);
    setFromUnit(keys[0]);
    setToUnit(keys[1] || keys[0]);
  };

  return (
    <div className="flex flex-col bg-slate-900/40 rounded-2xl border border-white/10 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <RefreshCw size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">Unit Converter</h3>
            <p className="text-xs text-slate-400 font-mono">Convert physical dimensions, speed, temperature, & data</p>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(Object.keys(UNITS) as UnitCategory[]).map((catKey) => (
          <button
            key={catKey}
            onClick={() => handleCategoryChange(catKey)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap capitalize ${
              category === catKey
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold'
                : 'bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {UNITS[catKey].name}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/80 p-3 rounded-xl border border-white/10 font-mono">
        <div>
          <label className="text-xs text-slate-400">From Value</label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white outline-none"
          />
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
            className="w-full mt-2 px-3 py-1.5 bg-slate-900 border border-white/10 text-xs text-teal-300 rounded-lg outline-none cursor-pointer"
          >
            {unitList.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-slate-400">Converted Value</label>
          <div className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm font-bold text-teal-300">
            {outputValue}
          </div>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
            className="w-full mt-2 px-3 py-1.5 bg-slate-900 border border-white/10 text-xs text-teal-300 rounded-lg outline-none cursor-pointer"
          >
            {unitList.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={() => onInsertToCalculator(outputValue.toString())}
        className="py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
      >
        <Calculator size={14} /> Send Converted Value ({outputValue}) to Calculator
      </button>
    </div>
  );
};
