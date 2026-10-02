export type ThemeId = 'cyberpunk' | 'retrowave' | 'aurora';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  bgColor: string;         // Entire screen background style
  calculatorBg: string;   // Frosted glass wrapper style
  displayBg: string;      // LCD display background style
  buttonClass: {
    number: string;
    operator: string;
    special: string;
  };
  textColor: {
    primary: string;
    secondary: string;
    accent: string;
  };
  accentColor: string;    // HEX or Tailwind color for sparks and particles
  particleColors: string[];
  audioClickType: 'sine' | 'square' | 'triangle';
}

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
  starred?: boolean;
  title?: string;
  tags?: string[];
  workspaceId?: string;
  category?: string;
}

export type SidebarSection = 
  | 'home'
  | 'calculator'
  | 'brain'
  | 'chat'
  | 'voice'
  | 'lens'
  | 'graph'
  | 'finance'
  | 'engineering'
  | 'converter'
  | 'history'
  | 'favorites'
  | 'workspaces'
  | 'templates'
  | 'settings';

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  notes: string;
  contextMemory: Record<string, string | number>;
  savedExpressions: string[];
}

export interface SmartTemplate {
  id: string;
  title: string;
  category: 'budget' | 'homework' | 'finance' | 'construction' | 'travel' | 'science';
  description: string;
  icon: string;
  fields: {
    id: string;
    label: string;
    defaultValue: number | string;
    unit?: string;
    placeholder?: string;
  }[];
  compute: (values: Record<string, number>) => {
    expression: string;
    result: string;
    breakdown: { label: string; value: string }[];
  };
}

export interface GraphEquation {
  id: string;
  formula: string; // e.g. "sin(x)", "x^2 - 4", "2*x + 1"
  color: string;
  visible: boolean;
  showDerivative?: boolean;
}

export interface ScientificConstant {
  symbol: string;
  name: string;
  value: number;
  unit: string;
  category: 'Physics' | 'Chemistry' | 'Astronomy' | 'Electromagnetism';
}

