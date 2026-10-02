import { SmartTemplate } from '../types';

export const SMART_TEMPLATES: SmartTemplate[] = [
  {
    id: 'monthly_budget',
    title: 'Monthly Budget & Savings Calculator',
    category: 'budget',
    description: 'Calculate total monthly net income, expenses, savings rate, and discretionary balance.',
    icon: 'Wallet',
    fields: [
      { id: 'income', label: 'Monthly Income ($)', defaultValue: 5000, unit: '$' },
      { id: 'housing', label: 'Rent / Mortgage ($)', defaultValue: 1500, unit: '$' },
      { id: 'food', label: 'Food & Groceries ($)', defaultValue: 600, unit: '$' },
      { id: 'utilities', label: 'Utilities & Subscriptions ($)', defaultValue: 300, unit: '$' },
      { id: 'savingsGoal', label: 'Target Savings ($)', defaultValue: 1000, unit: '$' }
    ],
    compute: (vals) => {
      const totalExpenses = vals.housing + vals.food + vals.utilities;
      const netRemaining = vals.income - totalExpenses;
      const finalDisposable = netRemaining - vals.savingsGoal;
      const savingsRate = ((vals.savingsGoal / vals.income) * 100).toFixed(1);

      return {
        expression: `${vals.income} - (${vals.housing} + ${vals.food} + ${vals.utilities}) - ${vals.savingsGoal}`,
        result: `$${finalDisposable.toLocaleString()} left`,
        breakdown: [
          { label: 'Total Monthly Income', value: `$${vals.income.toLocaleString()}` },
          { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}` },
          { label: 'Target Savings', value: `$${vals.savingsGoal.toLocaleString()} (${savingsRate}%)` },
          { label: 'Discretionary Disposable Income', value: `$${finalDisposable.toLocaleString()}` }
        ]
      };
    }
  },
  {
    id: 'tax_calculator',
    title: 'Income Tax & GST Estimator',
    category: 'finance',
    description: 'Calculate effective tax rates, net take-home salary, or sales GST/VAT.',
    icon: 'Receipt',
    fields: [
      { id: 'amount', label: 'Gross Amount ($)', defaultValue: 85000, unit: '$' },
      { id: 'taxRate', label: 'Estimated Tax / GST Rate (%)', defaultValue: 22, unit: '%' },
      { id: 'deductions', label: 'Standard Deductions ($)', defaultValue: 12500, unit: '$' }
    ],
    compute: (vals) => {
      const taxable = Math.max(0, vals.amount - vals.deductions);
      const taxOwed = taxable * (vals.taxRate / 100);
      const netTakeHome = vals.amount - taxOwed;
      const effectiveRate = ((taxOwed / vals.amount) * 100).toFixed(1);

      return {
        expression: `(${vals.amount} - ${vals.deductions}) * (${vals.taxRate} / 100)`,
        result: `$${netTakeHome.toLocaleString()} net`,
        breakdown: [
          { label: 'Gross Base Amount', value: `$${vals.amount.toLocaleString()}` },
          { label: 'Taxable Base After Deductions', value: `$${taxable.toLocaleString()}` },
          { label: 'Estimated Tax / GST Owed', value: `$${taxOwed.toLocaleString()}` },
          { label: 'Effective Tax Rate', value: `${effectiveRate}%` },
          { label: 'Net Remaining', value: `$${netTakeHome.toLocaleString()}` }
        ]
      };
    }
  },
  {
    id: 'student_homework_pythagoras',
    title: 'Hypotenuse & Triangle Solver (Pythagorean Theorem)',
    category: 'homework',
    description: 'Solve hypotenuse side c = √(a² + b²) with area and perimeter breakdown.',
    icon: 'Triangle',
    fields: [
      { id: 'a', label: 'Side a', defaultValue: 6, unit: 'units' },
      { id: 'b', label: 'Side b', defaultValue: 8, unit: 'units' }
    ],
    compute: (vals) => {
      const c = Math.sqrt(Math.pow(vals.a, 2) + Math.pow(vals.b, 2));
      const area = 0.5 * vals.a * vals.b;
      const perimeter = vals.a + vals.b + c;

      return {
        expression: `sqrt(${vals.a}^2 + ${vals.b}^2)`,
        result: `c = ${c.toFixed(2)}`,
        breakdown: [
          { label: 'Hypotenuse (c)', value: c.toFixed(3) },
          { label: 'Triangle Area', value: `${area.toFixed(2)} sq units` },
          { label: 'Perimeter', value: `${perimeter.toFixed(2)} units` }
        ]
      };
    }
  },
  {
    id: 'construction_concrete',
    title: 'Construction Concrete Volume & Cost',
    category: 'construction',
    description: 'Calculate volume (length × width × depth in feet) and total bags/cost needed.',
    icon: 'HardHat',
    fields: [
      { id: 'length', label: 'Slab Length (feet)', defaultValue: 20, unit: 'ft' },
      { id: 'width', label: 'Slab Width (feet)', defaultValue: 15, unit: 'ft' },
      { id: 'depthInches', label: 'Slab Depth (inches)', defaultValue: 4, unit: 'in' },
      { id: 'bagCost', label: 'Cost per 80lb bag ($)', defaultValue: 6.5, unit: '$' }
    ],
    compute: (vals) => {
      const depthFeet = vals.depthInches / 12;
      const cubicFeet = vals.length * vals.width * depthFeet;
      const cubicYards = cubicFeet / 27;
      // 1 cubic foot requires approx 1.6 bags of 80lb concrete
      const bags = Math.ceil(cubicFeet * 1.6);
      const totalCost = bags * vals.bagCost;

      return {
        expression: `${vals.length} * ${vals.width} * (${vals.depthInches} / 12) / 27`,
        result: `$${totalCost.toFixed(2)} (${bags} bags)`,
        breakdown: [
          { label: 'Volume (Cubic Feet)', value: `${cubicFeet.toFixed(2)} ft³` },
          { label: 'Volume (Cubic Yards)', value: `${cubicYards.toFixed(2)} yd³` },
          { label: 'Estimated 80lb Concrete Bags', value: `${bags} bags` },
          { label: 'Total Material Cost', value: `$${totalCost.toFixed(2)}` }
        ]
      };
    }
  },
  {
    id: 'travel_budget',
    title: 'Trip Travel Expense & Split Calculator',
    category: 'travel',
    description: 'Estimate total vacation budget per person across flights, stay, food, and activities.',
    icon: 'Plane',
    fields: [
      { id: 'flights', label: 'Flights Total ($)', defaultValue: 1200, unit: '$' },
      { id: 'hotelPerNight', label: 'Hotel / Airbnb per Night ($)', defaultValue: 150, unit: '$' },
      { id: 'nights', label: 'Total Nights', defaultValue: 5, unit: 'nights' },
      { id: 'foodPerDay', label: 'Food & Fun per Day ($)', defaultValue: 80, unit: '$' },
      { id: 'travelers', label: 'Number of Travelers', defaultValue: 3, unit: 'people' }
    ],
    compute: (vals) => {
      const totalHotel = vals.hotelPerNight * vals.nights;
      const totalFood = vals.foodPerDay * (vals.nights + 1) * vals.travelers;
      const grandTotal = vals.flights + totalHotel + totalFood;
      const perPerson = grandTotal / Math.max(1, vals.travelers);

      return {
        expression: `(${vals.flights} + (${vals.hotelPerNight} * ${vals.nights}) + (${vals.foodPerDay} * ${vals.nights + 1} * ${vals.travelers})) / ${vals.travelers}`,
        result: `$${perPerson.toFixed(2)} per person`,
        breakdown: [
          { label: 'Flights Total', value: `$${vals.flights.toLocaleString()}` },
          { label: 'Accommodation Total', value: `$${totalHotel.toLocaleString()}` },
          { label: 'Food & Activities Total', value: `$${totalFood.toLocaleString()}` },
          { label: 'Trip Grand Total', value: `$${grandTotal.toLocaleString()}` },
          { label: 'Cost Per Traveler', value: `$${perPerson.toFixed(2)}` }
        ]
      };
    }
  }
];
