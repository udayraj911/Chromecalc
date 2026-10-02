import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Plus, Trash2, Eye, EyeOff, Download, ZoomIn, ZoomOut, RefreshCw, Calculator, Sparkles } from 'lucide-react';
import { GraphEquation } from '../types';

interface GraphPlotterProps {
  onInsertToCalculator: (expr: string) => void;
  accentColor: string;
}

const DEFAULT_EQUATIONS: GraphEquation[] = [
  { id: '1', formula: 'sin(x)', color: '#06b6d4', visible: true, showDerivative: true },
  { id: '2', formula: '0.5 * x^2 - 3', color: '#ec4899', visible: true, showDerivative: false },
];

export const GraphPlotter: React.FC<GraphPlotterProps> = ({ onInsertToCalculator, accentColor }) => {
  const [equations, setEquations] = useState<GraphEquation[]>(DEFAULT_EQUATIONS);
  const [newFormula, setNewFormula] = useState('');
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [stepCount, setStepCount] = useState(120);

  // Evaluate formula string safely
  const evaluateMath = (formulaStr: string, xVal: number): number | null => {
    try {
      // Replace math tokens
      let expr = formulaStr.toLowerCase()
        .replace(/sin/g, 'Math.sin')
        .replace(/cos/g, 'Math.cos')
        .replace(/tan/g, 'Math.tan')
        .replace(/sqrt/g, 'Math.sqrt')
        .replace(/abs/g, 'Math.abs')
        .replace(/log/g, 'Math.log10')
        .replace(/ln/g, 'Math.log')
        .replace(/exp/g, 'Math.exp')
        .replace(/pi/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/\^/g, '**')
        .replace(/(\d+)(x)/g, '$1*$2')
        .replace(/(x)(\d+)/g, '$1*$2');

      // Execute safely with isolated Function
      const fn = new Function('x', `return ${expr};`);
      const val = fn(xVal);
      if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
        return val;
      }
      return null;
    } catch {
      return null;
    }
  };

  // Numerical Derivative calculation dy/dx
  const evaluateDerivative = (formulaStr: string, xVal: number): number | null => {
    const dx = 0.0001;
    const y1 = evaluateMath(formulaStr, xVal - dx);
    const y2 = evaluateMath(formulaStr, xVal + dx);
    if (y1 !== null && y2 !== null) {
      return (y2 - y1) / (2 * dx);
    }
    return null;
  };

  // Generate plot points
  const plotData = useMemo(() => {
    const points = [];
    const dx = (xMax - xMin) / stepCount;

    for (let i = 0; i <= stepCount; i++) {
      const x = Number((xMin + i * dx).toFixed(2));
      const pointObj: Record<string, any> = { x };

      equations.forEach((eq) => {
        if (eq.visible && eq.formula.trim()) {
          const y = evaluateMath(eq.formula, x);
          if (y !== null) {
            pointObj[`y_${eq.id}`] = Number(y.toFixed(3));
          }
          if (eq.showDerivative) {
            const dy = evaluateDerivative(eq.formula, x);
            if (dy !== null) {
              pointObj[`dy_${eq.id}`] = Number(dy.toFixed(3));
            }
          }
        }
      });

      points.push(pointObj);
    }
    return points;
  }, [equations, xMin, xMax, stepCount]);

  const addEquation = () => {
    if (!newFormula.trim()) return;
    const colors = ['#06b6d4', '#ec4899', '#f59e0b', '#10b981', '#a855f7', '#3b82f6'];
    const newEq: GraphEquation = {
      id: Date.now().toString(),
      formula: newFormula.trim(),
      color: colors[equations.length % colors.length],
      visible: true,
      showDerivative: false
    };
    setEquations([...equations, newEq]);
    setNewFormula('');
  };

  const removeEquation = (id: string) => {
    setEquations(equations.filter(e => e.id !== id));
  };

  const toggleVisibility = (id: string) => {
    setEquations(equations.map(e => e.id === id ? { ...e, visible: !e.visible } : e));
  };

  const toggleDerivative = (id: string) => {
    setEquations(equations.map(e => e.id === id ? { ...e, showDerivative: !e.showDerivative } : e));
  };

  const handleZoom = (factor: number) => {
    const range = (xMax - xMin) * factor;
    const center = (xMax + xMin) / 2;
    setXMin(Number((center - range / 2).toFixed(1)));
    setXMax(Number((center + range / 2).toFixed(1)));
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 rounded-2xl border border-white/10 p-4 space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-cyan-400" />
            2D Interactive Function Plotter
          </h2>
          <p className="text-xs text-slate-400 font-mono">
            Plot algebraic & trigonometric functions with slope derivative inspection
          </p>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => handleZoom(0.7)}
            className="p-1.5 hover:bg-white/10 text-slate-300 rounded-lg transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => handleZoom(1.3)}
            className="p-1.5 hover:bg-white/10 text-slate-300 rounded-lg transition-all cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => { setXMin(-10); setXMax(10); }}
            className="p-1.5 hover:bg-white/10 text-slate-300 rounded-lg transition-all cursor-pointer"
            title="Reset Bounds"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Equations Management */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Left: Input & List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. sin(x), x^3 - 2*x, cos(x)"
              value={newFormula}
              onChange={(e) => setNewFormula(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addEquation()}
              className="w-full px-3 py-2 bg-black/50 border border-white/10 focus:border-cyan-500 rounded-xl text-xs font-mono text-white outline-none"
            />
            <button
              onClick={addEquation}
              className="p-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer shrink-0"
              title="Add Function"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Equation List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {equations.map((eq) => (
              <div 
                key={eq.id}
                className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: eq.color }} />
                  <span className="text-white font-bold truncate">f(x) = {eq.formula}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleDerivative(eq.id)}
                    className={`px-1.5 py-0.5 text-[10px] rounded border transition-all cursor-pointer ${
                      eq.showDerivative ? 'bg-purple-500/30 border-purple-400 text-purple-300' : 'bg-white/5 border-transparent text-slate-500'
                    }`}
                    title="Toggle Derivative dy/dx"
                  >
                    dy/dx
                  </button>
                  <button
                    onClick={() => toggleVisibility(eq.id)}
                    className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {eq.visible ? <Eye size={14} /> : <EyeOff size={14} className="opacity-40" />}
                  </button>
                  <button
                    onClick={() => onInsertToCalculator(eq.formula)}
                    className="p-1 text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                    title="Send formula to main calculator"
                  >
                    <Calculator size={14} />
                  </button>
                  <button
                    onClick={() => removeEquation(eq.id)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Interactive Recharts Plot Canvas */}
        <div className="md:col-span-2 bg-slate-950/80 rounded-2xl border border-white/10 p-3 flex flex-col justify-between h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={plotData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="x" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff', fontFamily: 'monospace' }}
              />
              <ReferenceLine y={0} stroke="#64748b" strokeWidth={1.5} />
              <ReferenceLine x={0} stroke="#64748b" strokeWidth={1.5} />

              {equations.map((eq) => (
                <React.Fragment key={eq.id}>
                  {eq.visible && (
                    <Line
                      type="monotone"
                      dataKey={`y_${eq.id}`}
                      name={`f(x) = ${eq.formula}`}
                      stroke={eq.color}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                  {eq.visible && eq.showDerivative && (
                    <Line
                      type="monotone"
                      dataKey={`dy_${eq.id}`}
                      name={`d/dx (${eq.formula})`}
                      stroke={`${eq.color}88`}
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  )}
                </React.Fragment>
              ))}
            </LineChart>
          </ResponsiveContainer>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-white/5">
            <span>Range X: [{xMin}, {xMax}]</span>
            <span>Hover to inspect point values</span>
          </div>
        </div>
      </div>
    </div>
  );
};
