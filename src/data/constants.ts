import { ScientificConstant } from '../types';

export const SCIENTIFIC_CONSTANTS: ScientificConstant[] = [
  { symbol: 'c', name: 'Speed of Light in Vacuum', value: 299792458, unit: 'm/s', category: 'Physics' },
  { symbol: 'h', name: "Planck's Constant", value: 6.62607015e-34, unit: 'J·s', category: 'Physics' },
  { symbol: 'ħ', name: 'Reduced Planck Constant', value: 1.054571817e-34, unit: 'J·s', category: 'Physics' },
  { symbol: 'G', name: 'Gravitational Constant', value: 6.67430e-11, unit: 'm³/(kg·s²)', category: 'Physics' },
  { symbol: 'g', name: 'Standard Gravity', value: 9.80665, unit: 'm/s²', category: 'Physics' },
  { symbol: 'e', name: 'Elementary Charge', value: 1.602176634e-19, unit: 'C', category: 'Electromagnetism' },
  { symbol: 'N_A', name: "Avogadro's Number", value: 6.02214076e23, unit: 'mol⁻¹', category: 'Chemistry' },
  { symbol: 'k_B', name: "Boltzmann Constant", value: 1.380649e-23, unit: 'J/K', category: 'Physics' },
  { symbol: 'R', name: 'Ideal Gas Constant', value: 8.314462618, unit: 'J/(mol·K)', category: 'Chemistry' },
  { symbol: 'F', name: "Faraday Constant", value: 96485.3321, unit: 'C/mol', category: 'Chemistry' },
  { symbol: 'σ', name: 'Stefan-Boltzmann Constant', value: 5.670374419e-8, unit: 'W/(m²·K⁴)', category: 'Physics' },
  { symbol: 'ε_0', name: 'Vacuum Permittivity', value: 8.8541878128e-12, unit: 'F/m', category: 'Electromagnetism' },
  { symbol: 'μ_0', name: 'Vacuum Permeability', value: 1.25663706212e-6, unit: 'N/A²', category: 'Electromagnetism' },
  { symbol: 'k_e', name: 'Coulomb Constant', value: 8.9875517923e9, unit: 'N·m²/C²', category: 'Electromagnetism' },
  { symbol: 'Z_0', name: 'Impedance of Free Space', value: 376.730313668, unit: 'Ω', category: 'Electromagnetism' },
  { symbol: 'm_e', name: 'Electron Mass', value: 9.1093837015e-31, unit: 'kg', category: 'Physics' },
  { symbol: 'm_p', name: 'Proton Mass', value: 1.67262192369e-27, unit: 'kg', category: 'Physics' },
  { symbol: 'm_n', name: 'Neutron Mass', value: 1.67492749804e-27, unit: 'kg', category: 'Physics' },
  { symbol: 'R_∞', name: 'Rydberg Constant', value: 10973731.56816, unit: 'm⁻¹', category: 'Physics' },
  { symbol: 'a_0', name: 'Bohr Radius', value: 5.29177210903e-11, unit: 'm', category: 'Physics' },
  { symbol: 'α', name: 'Fine-Structure Constant', value: 7.2973525693e-3, unit: 'dimensionless', category: 'Physics' },
  { symbol: 'AU', name: 'Astronomical Unit', value: 149597870700, unit: 'm', category: 'Astronomy' },
  { symbol: 'ly', name: 'Light Year', value: 9.4607304725808e15, unit: 'm', category: 'Astronomy' },
  { symbol: 'pc', name: 'Parsec', value: 3.08567758149137e16, unit: 'm', category: 'Astronomy' }
];

export interface EngineeringFormula {
  id: string;
  title: string;
  category: 'Electronics' | 'Physics' | 'Thermodynamics' | 'Mechanics';
  description: string;
  formulaDisplay: string;
  inputs: { id: string; label: string; unit: string; defaultValue: number }[];
  compute: (vals: Record<string, number>) => { result: number; unit: string; steps: string };
}

export const ENGINEERING_FORMULAS: EngineeringFormula[] = [
  {
    id: 'ohms_law_voltage',
    title: "Ohm's Law (Voltage)",
    category: 'Electronics',
    description: 'Calculate voltage V from current I and resistance R',
    formulaDisplay: 'V = I × R',
    inputs: [
      { id: 'I', label: 'Current (I)', unit: 'A', defaultValue: 2 },
      { id: 'R', label: 'Resistance (R)', unit: 'Ω', defaultValue: 50 }
    ],
    compute: (vals) => ({
      result: vals.I * vals.R,
      unit: 'V',
      steps: `V = ${vals.I} A × ${vals.R} Ω = ${vals.I * vals.R} V`
    })
  },
  {
    id: 'electrical_power',
    title: 'Electrical Power',
    category: 'Electronics',
    description: 'Calculate power P from voltage V and current I',
    formulaDisplay: 'P = V × I',
    inputs: [
      { id: 'V', label: 'Voltage (V)', unit: 'V', defaultValue: 120 },
      { id: 'I', label: 'Current (I)', unit: 'A', defaultValue: 5 }
    ],
    compute: (vals) => ({
      result: vals.V * vals.I,
      unit: 'W',
      steps: `P = ${vals.V} V × ${vals.I} A = ${vals.V * vals.I} W`
    })
  },
  {
    id: 'resistors_parallel',
    title: 'Parallel Resistors (2 Resistors)',
    category: 'Electronics',
    description: 'Calculate equivalent resistance R_eq = (R1 × R2) / (R1 + R2)',
    formulaDisplay: 'R_eq = (R1 × R2) / (R1 + R2)',
    inputs: [
      { id: 'R1', label: 'Resistor 1 (R1)', unit: 'Ω', defaultValue: 100 },
      { id: 'R2', label: 'Resistor 2 (R2)', unit: 'Ω', defaultValue: 200 }
    ],
    compute: (vals) => {
      const eq = (vals.R1 * vals.R2) / (vals.R1 + vals.R2);
      return {
        result: Number(eq.toFixed(3)),
        unit: 'Ω',
        steps: `R_eq = (${vals.R1} × ${vals.R2}) / (${vals.R1} + ${vals.R2}) = ${eq.toFixed(3)} Ω`
      };
    }
  },
  {
    id: 'kinetic_energy',
    title: 'Kinetic Energy',
    category: 'Physics',
    description: 'Calculate energy E_k = 0.5 × m × v²',
    formulaDisplay: 'E_k = ½ m v²',
    inputs: [
      { id: 'm', label: 'Mass (m)', unit: 'kg', defaultValue: 10 },
      { id: 'v', label: 'Velocity (v)', unit: 'm/s', defaultValue: 15 }
    ],
    compute: (vals) => {
      const ke = 0.5 * vals.m * Math.pow(vals.v, 2);
      return {
        result: ke,
        unit: 'J',
        steps: `E_k = 0.5 × ${vals.m} kg × (${vals.v} m/s)² = ${ke} Joules`
      };
    }
  },
  {
    id: 'force_f_ma',
    title: "Newton's Second Law",
    category: 'Mechanics',
    description: 'Calculate force F = m × a',
    formulaDisplay: 'F = m × a',
    inputs: [
      { id: 'm', label: 'Mass (m)', unit: 'kg', defaultValue: 75 },
      { id: 'a', label: 'Acceleration (a)', unit: 'm/s²', defaultValue: 9.8 }
    ],
    compute: (vals) => {
      const force = vals.m * vals.a;
      return {
        result: Number(force.toFixed(2)),
        unit: 'N',
        steps: `F = ${vals.m} kg × ${vals.a} m/s² = ${force.toFixed(2)} Newtons`
      };
    }
  }
];
