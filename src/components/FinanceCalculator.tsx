import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Percent, 
  Building2, 
  Receipt, 
  PieChart, 
  ArrowRight, 
  Send,
  Calculator
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface FinanceCalculatorProps {
  onInsertToCalculator: (expr: string) => void;
}

type FinanceTab = 'emi' | 'sip' | 'tax' | 'profit';

export const FinanceCalculator: React.FC<FinanceCalculatorProps> = ({ onInsertToCalculator }) => {
  const [activeTab, setActiveTab] = useState<FinanceTab>('emi');

  // EMI State
  const [loanAmount, setLoanAmount] = useState(250000);
  const [interestRate, setInterestRate] = useState(8.5);
  const [loanTenureYears, setLoanTenureYears] = useState(15);

  // SIP State
  const [monthlySip, setMonthlySip] = useState(500);
  const [sipReturnRate, setSipReturnRate] = useState(12);
  const [sipYears, setSipYears] = useState(10);

  // Tax State
  const [grossIncome, setGrossIncome] = useState(85000);
  const [taxPercent, setTaxPercent] = useState(22);
  const [deductions, setDeductions] = useState(12000);

  // Profit/Loss State
  const [costPrice, setCostPrice] = useState(150);
  const [sellingPrice, setSellingPrice] = useState(220);

  // EMI Calculations
  const emiData = useMemo(() => {
    const P = loanAmount;
    const r = interestRate / 12 / 100;
    const n = loanTenureYears * 12;

    if (P <= 0 || r <= 0 || n <= 0) {
      return { emi: 0, totalPayment: 0, totalInterest: 0, breakdown: [] };
    }

    const emiVal = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalPay = emiVal * n;
    const totalInt = totalPay - P;

    const breakdown = [];
    let balance = P;
    for (let yr = 1; yr <= loanTenureYears; yr++) {
      let interestForYr = 0;
      for (let m = 0; m < 12; m++) {
        const intForM = balance * r;
        interestForYr += intForM;
        const principalForM = emiVal - intForM;
        balance = Math.max(0, balance - principalForM);
      }
      breakdown.push({
        year: `Yr ${yr}`,
        balance: Math.round(balance),
        paidInterest: Math.round(totalInt * (yr / loanTenureYears)),
        principal: Math.round(P * (yr / loanTenureYears))
      });
    }

    return {
      emi: Math.round(emiVal),
      totalPayment: Math.round(totalPay),
      totalInterest: Math.round(totalInt),
      breakdown
    };
  }, [loanAmount, interestRate, loanTenureYears]);

  // SIP Calculations
  const sipData = useMemo(() => {
    const P = monthlySip;
    const i = sipReturnRate / 12 / 100;
    const n = sipYears * 12;

    let invested = 0;
    let value = 0;
    const growth = [];

    for (let yr = 1; yr <= sipYears; yr++) {
      for (let m = 0; m < 12; m++) {
        invested += P;
        value = (value + P) * (1 + i);
      }
      growth.push({
        year: `Yr ${yr}`,
        Invested: Math.round(invested),
        EstimatedWealth: Math.round(value)
      });
    }

    return {
      totalInvested: Math.round(invested),
      estimatedValue: Math.round(value),
      wealthGain: Math.round(value - invested),
      growth
    };
  }, [monthlySip, sipReturnRate, sipYears]);

  // Tax Calculations
  const taxData = useMemo(() => {
    const taxable = Math.max(0, grossIncome - deductions);
    const taxOwed = taxable * (taxPercent / 100);
    const netTakeHome = grossIncome - taxOwed;
    return {
      taxable,
      taxOwed: Math.round(taxOwed),
      netTakeHome: Math.round(netTakeHome),
      effectiveRate: ((taxOwed / grossIncome) * 100).toFixed(1)
    };
  }, [grossIncome, taxPercent, deductions]);

  // Profit/Loss Calculations
  const profitData = useMemo(() => {
    const diff = sellingPrice - costPrice;
    const isProfit = diff >= 0;
    const pct = costPrice > 0 ? (diff / costPrice) * 100 : 0;
    return {
      diff: Math.abs(diff),
      isProfit,
      percentage: Math.abs(pct).toFixed(1)
    };
  }, [costPrice, sellingPrice]);

  return (
    <div className="flex flex-col bg-slate-900/40 rounded-2xl border border-white/10 p-4 space-y-4">
      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        {[
          { id: 'emi', label: 'Loan EMI', icon: Building2 },
          { id: 'sip', label: 'SIP Growth', icon: TrendingUp },
          { id: 'tax', label: 'Tax & GST', icon: Receipt },
          { id: 'profit', label: 'Profit & Loss', icon: Percent },
        ].map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FinanceTab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold shadow'
                  : 'bg-white/5 border border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <IconComp size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'emi' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-slate-400 flex justify-between">
                <span>Loan Amount ($)</span>
                <span className="text-emerald-400 font-bold">${loanAmount.toLocaleString()}</span>
              </label>
              <input
                type="range" min="10000" max="2000000" step="10000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 flex justify-between">
                <span>Interest Rate (% per annum)</span>
                <span className="text-emerald-400 font-bold">{interestRate}%</span>
              </label>
              <input
                type="range" min="1" max="25" step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 flex justify-between">
                <span>Loan Tenure (Years)</span>
                <span className="text-emerald-400 font-bold">{loanTenureYears} Years</span>
              </label>
              <input
                type="range" min="1" max="30" step="1"
                value={loanTenureYears}
                onChange={(e) => setLoanTenureYears(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <button
              onClick={() => onInsertToCalculator(emiData.emi.toString())}
              className="w-full py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calculator size={14} /> Send Monthly EMI (${emiData.emi.toLocaleString()}) to Calculator
            </button>
          </div>

          <div className="bg-slate-950/80 rounded-xl border border-white/10 p-3 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[10px] font-mono text-slate-400">Monthly EMI</div>
                <div className="text-lg font-mono font-bold text-emerald-400">${emiData.emi.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[10px] font-mono text-slate-400">Total Interest Owed</div>
                <div className="text-lg font-mono font-bold text-amber-400">${emiData.totalInterest.toLocaleString()}</div>
              </div>
            </div>

            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={emiData.breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="balance" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sip' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-mono text-slate-400 flex justify-between">
                <span>Monthly Investment ($)</span>
                <span className="text-cyan-400 font-bold">${monthlySip.toLocaleString()}</span>
              </label>
              <input
                type="range" min="50" max="10000" step="50"
                value={monthlySip}
                onChange={(e) => setMonthlySip(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 flex justify-between">
                <span>Expected Annual Return (%)</span>
                <span className="text-cyan-400 font-bold">{sipReturnRate}%</span>
              </label>
              <input
                type="range" min="1" max="30" step="0.5"
                value={sipReturnRate}
                onChange={(e) => setSipReturnRate(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 flex justify-between">
                <span>Time Horizon (Years)</span>
                <span className="text-cyan-400 font-bold">{sipYears} Years</span>
              </label>
              <input
                type="range" min="1" max="40" step="1"
                value={sipYears}
                onChange={(e) => setSipYears(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            <button
              onClick={() => onInsertToCalculator(sipData.estimatedValue.toString())}
              className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Calculator size={14} /> Send Wealth Total (${sipData.estimatedValue.toLocaleString()}) to Calc
            </button>
          </div>

          <div className="bg-slate-950/80 rounded-xl border border-white/10 p-3 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-2 text-center mb-3">
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[10px] font-mono text-slate-400">Total Invested</div>
                <div className="text-base font-mono font-bold text-slate-300">${sipData.totalInvested.toLocaleString()}</div>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <div className="text-[10px] font-mono text-slate-400">Estimated Wealth</div>
                <div className="text-base font-mono font-bold text-cyan-400">${sipData.estimatedValue.toLocaleString()}</div>
              </div>
            </div>

            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sipData.growth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', fontSize: '11px' }} />
                  <Area type="monotone" dataKey="EstimatedWealth" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="Invested" stroke="#64748b" fill="#64748b" fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tax' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400">Gross Income ($)</label>
              <input
                type="number"
                value={grossIncome}
                onChange={(e) => setGrossIncome(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400">Estimated Tax Rate (%)</label>
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400">Deductions ($)</label>
              <input
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-white/10 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] font-mono text-slate-400">Taxable Base</div>
              <div className="text-sm font-mono font-bold text-slate-200">${taxData.taxable.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400">Tax Owed</div>
              <div className="text-sm font-mono font-bold text-pink-400">${taxData.taxOwed.toLocaleString()} ({taxData.effectiveRate}%)</div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-slate-400">Net Take-Home</div>
              <div className="text-sm font-mono font-bold text-emerald-400">${taxData.netTakeHome.toLocaleString()}</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profit' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-400">Cost Price ($)</label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-mono text-slate-400">Selling Price ($)</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs font-mono text-white outline-none"
              />
            </div>
          </div>

          <div className={`p-4 rounded-xl border text-center font-mono ${
            profitData.isProfit 
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
              : 'bg-red-950/30 border-red-500/40 text-red-300'
          }`}>
            <div className="text-xs font-bold uppercase tracking-wider">
              {profitData.isProfit ? 'PROFIT GAIN' : 'LOSS INCURRED'}
            </div>
            <div className="text-2xl font-bold mt-1">
              ${profitData.diff.toLocaleString()} ({profitData.percentage}%)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
