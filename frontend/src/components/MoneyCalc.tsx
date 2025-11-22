import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { 
  TrendingUp, 
  Plus, 
  X, 
  Home, 
  TrendingDown, 
  DollarSign, 
  PiggyBank,
  Car,
  Banknote,
  Wallet,
  CreditCard,
  GraduationCap,
  User,
  Gift,
  Briefcase,
  ShoppingCart,
  Utensils,
  Plane,
  Heart,
  Zap,
  MoreHorizontal,
  IndianRupeeIcon
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

interface Asset {
  id: string;
  name: string;
  value: number;
  category: 'realestate' | 'investments' | 'vehicles' | 'bank' | 'cash' | 'other';
  purchaseDate?: string;
  appreciationRate?: number;
  notes?: string;
}

interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: 'monthly' | 'annually' | 'weekly' | 'daily';
  category: 'salary' | 'investment' | 'gift' | 'other';
  date?: string;
  notes?: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: 'shopping' | 'housing' | 'transport' | 'food' | 'health' | 'travel' | 'utilities' | 'other';
  frequency: 'monthly' | 'annually' | 'weekly' | 'daily' | 'once';
  date?: string;
  isEssential?: boolean;
  notes?: string;
}

interface Liability {
  id: string;
  name: string;
  amount: number;
  category: 'homeloan' | 'carloan' | 'personalloan' | 'creditcard' | 'education' | 'other';
  interestRate?: number;
  dueDate?: string;
  monthlyPayment?: number;
  notes?: string;
}

type FinancialDataType = 'asset' | 'income' | 'expense' | 'liability';

interface CalculatorProps {
  title: string;
  children: React.ReactNode;
}

const CalculatorCard: React.FC<CalculatorProps> = ({ title, children }) => (
  <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mb-6">
    <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
      {title}
    </h3>
    {children}
  </div>
);

const formatRupees = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};



const MoneyCalc = () => {
  const { user } = useUser();
  const [timeframe, setTimeframe] = useState<number>(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDataType, setSelectedDataType] = useState<FinancialDataType>('asset');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Asset form data
  const [assetFormData, setAssetFormData] = useState({
    name: '',
    value: '',
    category: 'bank',
    purchaseDate: '',
    appreciationRate: '',
    notes: ''
  });

  // Income form data
  const [incomeFormData, setIncomeFormData] = useState({
    source: '',
    amount: '',
    frequency: 'monthly',
    category: 'salary',
    date: '',
    notes: ''
  });

  // Expense form data
  const [expenseFormData, setExpenseFormData] = useState({
    name: '',
    amount: '',
    category: 'other',
    frequency: 'monthly',
    date: '',
    isEssential: false,
    notes: ''
  });

  // Liability form data
  const [liabilityFormData, setLiabilityFormData] = useState({
    name: '',
    amount: '',
    category: 'other',
    interestRate: '',
    dueDate: '',
    monthlyPayment: '',
    notes: ''
  });

  // Fetch all user financial data from MongoDB
  useEffect(() => {
    const fetchAllFinancialData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        
        // Fetch assets
        const assetsResponse = await fetch(
          `${SERVER_URL}/api/user-profile/assets?clerkUserId=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json();
          const normalizedAssets = (assetsData.assets || [])
            .map(normalizeAsset)
            .filter((asset: Asset) => Boolean(asset.id));
          setAssets(normalizedAssets);
        }

        // Fetch income
        const incomeResponse = await fetch(
          `${SERVER_URL}/api/user-profile/income?clerkUserId=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (incomeResponse.ok) {
          const incomeData = await incomeResponse.json();
          const normalizedIncome = (incomeData.income || [])
            .map(normalizeIncome)
            .filter((inc: Income) => Boolean(inc.id));
          setIncome(normalizedIncome);
        }

        // Fetch expenses  
        const expensesResponse = await fetch(
          `${SERVER_URL}/api/user-profile/expenses?clerkUserId=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json();
          const normalizedExpenses = (expensesData.expenses || [])
            .map(normalizeExpense)
            .filter((exp: Expense) => Boolean(exp.id));
          setExpenses(normalizedExpenses);
        }

        // Fetch liabilities
        const liabilitiesResponse = await fetch(
          `${SERVER_URL}/api/user-profile/liabilities?clerkUserId=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (liabilitiesResponse.ok) {
          const liabilitiesData = await liabilitiesResponse.json();
          const normalizedLiabilities = (liabilitiesData.liabilities || [])
            .map(normalizeLiability)
            .filter((liab: Liability) => Boolean(liab.id));
          setLiabilities(normalizedLiabilities);
        }

      } catch (error) {
        console.error('Error fetching financial data:', error);
        setError('Failed to fetch financial data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllFinancialData();
  }, [user]);

  const calculateFutureValue = (
    currentValue: number,
    expectedReturn: number,
    years: number
  ) => {
    const annualRate = expectedReturn / 100;
    return currentValue * Math.pow(1 + annualRate, years);
  };

  const categoryLabels = {
    realestate: 'Real Estate',
    investments: 'Investments', 
    vehicles: 'Vehicles',
    bank: 'Bank Account',
    cash: 'Cash',
    other: 'Other'
  };

  const getAssetExpectedReturn = (asset: Asset): number => {
    // Use appreciationRate if available, otherwise default based on category
    if (asset.appreciationRate) return asset.appreciationRate;
    
    // Default returns by category
    const defaultReturns: { [key: string]: number } = {
      'realestate': 8,
      'investments': 12,
      'vehicles': 0,  // Vehicles typically depreciate
      'bank': 4,
      'cash': 0,  // Cash doesn't appreciate
      'other': 6
    };
    
    return defaultReturns[asset.category] || 6;
  };

  const generateGraphData = () => {
    const data = [];
    for (let year = 0; year <= timeframe; year++) {
      const yearData: any = { year };
      let totalValue = 0;
      
      assets.forEach((asset) => {
        const expectedReturn = getAssetExpectedReturn(asset);
        const futureValue = calculateFutureValue(
          asset.value,
          expectedReturn,
          year
        );
        yearData[asset.name] = futureValue;
        totalValue += futureValue;
      });
      
      yearData.Total = totalValue;
      data.push(yearData);
    }
    return data;
  };

  const normalizeAsset = (doc: any): Asset => ({
    id: doc?.id ?? doc?._id ?? '',
    name: doc?.name ?? '',
    value:
      typeof doc?.value === 'number'
        ? doc.value
        : Number.parseFloat(doc?.value ?? '0') || 0,
    category: (doc?.category ?? 'other') as Asset['category'],
    purchaseDate: doc?.purchaseDate ?? undefined,
    appreciationRate:
      typeof doc?.appreciationRate === 'number'
        ? doc.appreciationRate
        : doc?.appreciationRate
        ? Number.parseFloat(doc.appreciationRate)
        : undefined,
    notes: doc?.notes ?? undefined,
  });

  const normalizeIncome = (doc: any): Income => ({
    id: doc?.id ?? doc?._id ?? '',
    source: doc?.source ?? '',
    amount:
      typeof doc?.amount === 'number'
        ? doc.amount
        : Number.parseFloat(doc?.amount ?? '0') || 0,
    frequency: (doc?.frequency ?? 'monthly') as Income['frequency'],
    category: (doc?.category ?? 'other') as Income['category'],
    date: doc?.date ?? undefined,
    notes: doc?.notes ?? undefined,
  });

  const normalizeExpense = (doc: any): Expense => ({
    id: doc?.id ?? doc?._id ?? '',
    name: doc?.name ?? '',
    amount:
      typeof doc?.amount === 'number'
        ? doc.amount
        : Number.parseFloat(doc?.amount ?? '0') || 0,
    category: (doc?.category ?? 'other') as Expense['category'],
    frequency: (doc?.frequency ?? 'monthly') as Expense['frequency'],
    date: doc?.date ?? undefined,
    isEssential: Boolean(doc?.isEssential),
    notes: doc?.notes ?? undefined,
  });

  const normalizeLiability = (doc: any): Liability => ({
    id: doc?.id ?? doc?._id ?? '',
    name: doc?.name ?? '',
    amount:
      typeof doc?.amount === 'number'
        ? doc.amount
        : Number.parseFloat(doc?.amount ?? '0') || 0,
    category: (doc?.category ?? 'other') as Liability['category'],
    interestRate:
      typeof doc?.interestRate === 'number'
        ? doc.interestRate
        : doc?.interestRate
        ? Number.parseFloat(doc.interestRate)
        : undefined,
    dueDate: doc?.dueDate ?? undefined,
    monthlyPayment:
      typeof doc?.monthlyPayment === 'number'
        ? doc.monthlyPayment
        : doc?.monthlyPayment
        ? Number.parseFloat(doc.monthlyPayment)
        : undefined,
    notes: doc?.notes ?? undefined,
  });

  // Category icons mapping
  const categoryIcons = {
    // Asset categories
    realestate: Home,
    investments: TrendingUp, 
    vehicles: Car,
    bank: Banknote,
    cash: Wallet,
    // Income categories
    salary: Briefcase,
    investment: TrendingUp,
    gift: Gift,
    // Expense categories  
    shopping: ShoppingCart,
    housing: Home,
    transport: Car,
    food: Utensils,
    health: Heart,
    travel: Plane,
    utilities: Zap,
    // Liability categories
    homeloan: Home,
    carloan: Car,
    personalloan: User,
    creditcard: CreditCard,
    education: GraduationCap,
    other: MoreHorizontal
  };

  const handleAddAsset = async () => {
    if (!user?.id) return;

    try {
      const valueRaw = Number.parseFloat(assetFormData.value);
      const value = Number.isNaN(valueRaw) ? 0 : valueRaw;
      const appreciationRaw = assetFormData.appreciationRate
        ? Number.parseFloat(assetFormData.appreciationRate)
        : undefined;
      const appreciationRate =
        appreciationRaw !== undefined && !Number.isNaN(appreciationRaw)
          ? appreciationRaw
          : undefined;

      const response = await fetch(`${SERVER_URL}/api/user-profile/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          name: assetFormData.name,
          value,
          category: assetFormData.category,
          purchaseDate: assetFormData.purchaseDate || null,
          appreciationRate: appreciationRate ?? null,
          notes: assetFormData.notes || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.asset) {
          setAssets((prev) => [...prev, normalizeAsset(result.asset)]);
        }
        setIsModalOpen(false);
        resetForms();
      } else {
        console.error('Failed to add asset');
        setError('Failed to add asset');
      }
    } catch (error) {
      console.error('Error adding asset:', error);
      setError('Failed to add asset');
    }
  };

  const handleAddIncome = async () => {
    if (!user?.id) return;

    try {
      const amountRaw = Number.parseFloat(incomeFormData.amount);
      const amount = Number.isNaN(amountRaw) ? 0 : amountRaw;

      const response = await fetch(`${SERVER_URL}/api/user-profile/income`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          source: incomeFormData.source,
          amount,
          frequency: incomeFormData.frequency,
          category: incomeFormData.category,
          date: incomeFormData.date || null,
          notes: incomeFormData.notes || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.income) {
          setIncome((prev) => [...prev, normalizeIncome(result.income)]);
        }
        setIsModalOpen(false);
        resetForms();
      } else {
        console.error('Failed to add income');
        setError('Failed to add income');
      }
    } catch (error) {
      console.error('Error adding income:', error);
      setError('Failed to add income');
    }
  };

  const handleAddExpense = async () => {
    if (!user?.id) return;

    try {
      const amountRaw = Number.parseFloat(expenseFormData.amount);
      const amount = Number.isNaN(amountRaw) ? 0 : amountRaw;

      const response = await fetch(`${SERVER_URL}/api/user-profile/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          name: expenseFormData.name,
          amount,
          category: expenseFormData.category,
          frequency: expenseFormData.frequency,
          date: expenseFormData.date || null,
          isEssential: expenseFormData.isEssential,
          notes: expenseFormData.notes || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.expense) {
          setExpenses((prev) => [...prev, normalizeExpense(result.expense)]);
        }
        setIsModalOpen(false);
        resetForms();
      } else {
        console.error('Failed to add expense');
        setError('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      setError('Failed to add expense');
    }
  };

  const handleAddLiability = async () => {
    if (!user?.id) return;

    try {
      const amountRaw = Number.parseFloat(liabilityFormData.amount);
      const amount = Number.isNaN(amountRaw) ? 0 : amountRaw;
      const interestRateRaw = liabilityFormData.interestRate
        ? Number.parseFloat(liabilityFormData.interestRate)
        : undefined;
      const interestRate =
        interestRateRaw !== undefined && !Number.isNaN(interestRateRaw)
          ? interestRateRaw
          : undefined;
      const monthlyPaymentRaw = liabilityFormData.monthlyPayment
        ? Number.parseFloat(liabilityFormData.monthlyPayment)
        : undefined;
      const monthlyPayment =
        monthlyPaymentRaw !== undefined && !Number.isNaN(monthlyPaymentRaw)
          ? monthlyPaymentRaw
          : undefined;

      const response = await fetch(`${SERVER_URL}/api/user-profile/liabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          name: liabilityFormData.name,
          amount,
          category: liabilityFormData.category,
          interestRate: interestRate ?? null,
          dueDate: liabilityFormData.dueDate || null,
          monthlyPayment: monthlyPayment ?? null,
          notes: liabilityFormData.notes || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.liability) {
          setLiabilities((prev) => [...prev, normalizeLiability(result.liability)]);
        }
        setIsModalOpen(false);
        resetForms();
      } else {
        console.error('Failed to add liability');
        setError('Failed to add liability');
      }
    } catch (error) {
      console.error('Error adding liability:', error);
      setError('Failed to add liability');
    }
  };

  const resetForms = () => {
    setAssetFormData({
      name: '',
      value: '',
      category: 'bank',
      purchaseDate: '',
      appreciationRate: '',
      notes: ''
    });
    setIncomeFormData({
      source: '',
      amount: '',
      frequency: 'monthly',
      category: 'salary',
      date: '',
      notes: ''
    });
    setExpenseFormData({
      name: '',
      amount: '',
      category: 'other',
      frequency: 'monthly',
      date: '',
      isEssential: false,
      notes: ''
    });
    setLiabilityFormData({
      name: '',
      amount: '',
      category: 'other',
      interestRate: '',
      dueDate: '',
      monthlyPayment: '',
      notes: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    switch (selectedDataType) {
      case 'asset':
        handleAddAsset();
        break;
      case 'income':
        handleAddIncome();
        break;
      case 'expense':
        handleAddExpense();
        break;
      case 'liability':
        handleAddLiability();
        break;
      default:
        console.error('Unknown data type selected');
    }
  };

  const colors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6"];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your assets...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
      <TrendingUp className="h-6 w-6 mr-2 text-indigo-500 dark:text-indigo-400" />
      Financial Portfolio Calculator
    </h2>      {/* Time Control and Add Asset Button */}
      {/* Enhanced Control Panel */}
      <div className="bg-gradient-to-br from-white via-gray-50/80 to-indigo-50/30 dark:from-gray-800 dark:via-gray-800/90 dark:to-indigo-900/20 rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700/60 backdrop-blur-sm p-8 mb-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-100/30 to-purple-100/20 dark:from-indigo-900/20 dark:to-purple-900/10 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-100/20 to-indigo-100/30 dark:from-purple-900/10 dark:to-indigo-900/20 rounded-full translate-y-24 -translate-x-24"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Left Section - Timeframe Controls */}
            <div className="flex-1">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Portfolio Projection
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Visualize your wealth growth over time
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Selection Display */}
              <div className="bg-white/80 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-600/60 p-6 mb-8 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {timeframe}
                      </div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {timeframe === 1 ? 'Year' : 'Years'}
                      </div>
                    </div>
                    <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        Timeline Selected
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {timeframe <= 5 ? 'Short-term projection' : 
                         timeframe <= 15 ? 'Medium-term forecast' : 
                         'Long-term investment horizon'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTimeframe(Math.max(1, timeframe - 1))}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 hover:border-indigo-300 dark:hover:border-indigo-400 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setTimeframe(Math.min(30, timeframe + 1))}
                      className="w-10 h-10 flex items-center justify-center bg-white dark:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-500 hover:border-indigo-300 dark:hover:border-indigo-400 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Slider */}
              <div className="mb-8">
                <div className="relative">
                  {/* Slider Track */}
                  <div className="relative h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-600 dark:via-gray-700 dark:to-gray-600 rounded-full shadow-inner">
                    {/* Progress Fill */}
                    <div 
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 rounded-full shadow-md transition-all duration-500 ease-out"
                      style={{ width: `${(timeframe / 30) * 100}%` }}
                    />
                    
                    {/* Gradient Overlay for Glass Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none"></div>
                    
                    {/* Hidden Range Input */}
                    <input
                      type="range"
                      min="1"
                      max="30"
                      value={timeframe}
                      onChange={(e) => setTimeframe(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    {/* Custom Thumb */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-200 rounded-full shadow-lg border-2 border-indigo-500 transition-all duration-300 hover:scale-125 hover:shadow-xl z-20 cursor-pointer"
                      style={{ left: `calc(${(timeframe / 30) * 100}% - 12px)` }}
                    >
                      <div className="absolute inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full"></div>
                    </div>
                  </div>
                  
                  {/* Scale Markers */}
                  <div className="flex justify-between mt-4 px-1">
                    {[1, 5, 10, 15, 20, 25, 30].map((year) => (
                      <div key={year} className="flex flex-col items-center">
                        <div className="w-px h-2 bg-gray-300 dark:bg-gray-600 mb-2"></div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Selection Pills */}
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Quick Selection:</p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { value: 1, label: '1Y', desc: 'Short' },
                    { value: 3, label: '3Y', desc: 'Quick' },
                    { value: 5, label: '5Y', desc: 'Standard' },
                    { value: 10, label: '10Y', desc: 'Decade' },
                    { value: 15, label: '15Y', desc: 'Extended' },
                    { value: 20, label: '20Y', desc: 'Career' },
                    { value: 30, label: '30Y', desc: 'Retirement' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setTimeframe(option.value)}
                      className={`group relative px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                        timeframe === option.value
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                          : 'bg-white/70 dark:bg-gray-700/70 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400 shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-bold">{option.label}</div>
                        <div className="text-xs opacity-75">{option.desc}</div>
                      </div>
                      {timeframe === option.value && (
                        <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Section - Add Data Button */}
            <div className="lg:w-64 flex flex-col items-center">
              <div className="bg-white/70 dark:bg-gray-700/50 backdrop-blur-sm rounded-2xl border border-gray-200/60 dark:border-gray-600/60 p-6 shadow-xl w-full">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <IndianRupeeIcon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Add Financial Data
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Build your portfolio by adding assets, income, expenses, and liabilities
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDataType('asset');
                    setIsModalOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl shadow-lg shadow-indigo-500/25 active:scale-95"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Data
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Assets Table */}
          <CalculatorCard title="Your Assets">
          {assets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-300" />
              <p className="text-gray-600 dark:text-gray-400 text-lg">No assets added yet</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Add your first asset to see growth projections
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Current Value (₹)
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expected Return (%)
                  </th>
                  <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Future Value ({timeframe} years)
                  </th>
              </tr>
            </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {assets.map((asset) => {
                  const expectedReturn = getAssetExpectedReturn(asset);
                  const futureValue = calculateFutureValue(
                    asset.value,
                    expectedReturn,
                    timeframe
                  );
                return (
                    <tr
                      key={asset.id || asset.name}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {asset.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {categoryLabels[asset.category]}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {formatRupees(asset.value)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {expectedReturn}%
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        {formatRupees(futureValue)}
                      </td>
                  </tr>
                );
              })}
                <tr className="bg-indigo-50 dark:bg-indigo-900/20 font-medium">
                <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                    Total Portfolio
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    -
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 dark:text-white">
                    {formatRupees(
                      assets.reduce(
                        (sum, asset) => sum + asset.value,
                        0
                      )
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    -
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400">
                    {formatRupees(
                      assets.reduce(
                        (sum, asset) =>
                          sum +
                          calculateFutureValue(
                            asset.value,
                            getAssetExpectedReturn(asset),
                            timeframe
                          ),
                        0
                      )
                    )}
                </td>
              </tr>
                </tbody>
              </table>
            </div>
          )}
        </CalculatorCard>

        {/* Growth Chart */}
        <CalculatorCard title="Portfolio Growth Projection">
          {assets.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg h-[400px] flex items-center justify-center">
              <div>
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-300" />
                <p className="text-gray-600 dark:text-gray-400 text-lg">No data to visualize</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                  Add assets to see portfolio growth projections
                </p>
              </div>
            </div>
          ) : (
            <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={generateGraphData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="year"
                  label={{ value: "Years", position: "bottom", offset: -5 }}
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <YAxis
                  label={{
                    value: "Value (₹)",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    style: { textAnchor: "middle" },
                  }}
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                  tick={{ fontSize: 12 }}
                  stroke="#6B7280"
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatRupees(value),
                    name === "Total" ? "Total Portfolio" : name,
                  ]}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                    padding: "8px 12px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                  wrapperStyle={{
                    outline: "none",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {value === "Total" ? "Total Portfolio" : value}
                    </span>
                  )}
                  wrapperStyle={{
                    paddingTop: "20px",
                  }}
                />
                {assets.map((asset, index) => (
                  <Line
                    key={asset.id || asset.name}
                    type="monotone"
                    dataKey={asset.name}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{
                      r: 6,
                      stroke: colors[index % colors.length],
                      strokeWidth: 2,
                      fill: "white",
                    }}
                  />
                ))}
                <Line
                  type="monotone"
                  dataKey="Total"
                  stroke="#000000"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{
                    r: 8,
                    stroke: "#000000",
                    strokeWidth: 2,
                    fill: "white",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          )}
        </CalculatorCard>
      </div>

      {/* Comprehensive Financial Data Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Add Financial Data
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Data Type Selection */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                What would you like to add? *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDataType('asset')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedDataType === 'asset'
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500'
                  }`}
                >
                  <PiggyBank className={`w-6 h-6 mx-auto mb-2 ${
                    selectedDataType === 'asset'
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`} />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Asset</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Property, investments</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedDataType('income')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedDataType === 'income'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-500'
                  }`}
                >
                  <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${
                    selectedDataType === 'income'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`} />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Income</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Salary, investments</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedDataType('expense')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedDataType === 'expense'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500'
                  }`}
                >
                  <TrendingDown className={`w-6 h-6 mx-auto mb-2 ${
                    selectedDataType === 'expense'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`} />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Expense</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Bills, shopping</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setSelectedDataType('liability')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedDataType === 'liability'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-500'
                  }`}
                >
                  <IndianRupeeIcon className={`w-6 h-6 mx-auto mb-2 ${
                    selectedDataType === 'liability'
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-gray-600 dark:text-gray-300'
                  }`} />
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Liability</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Loans, debts</div>
                </button>
              </div>
            </div>

            {/* Dynamic Form Based on Selected Type */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {selectedDataType === 'asset' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Asset Name *
                    </label>
                    <input
                      type="text"
                      value={assetFormData.name}
                      onChange={(e) => setAssetFormData({ ...assetFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Mumbai Apartment"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Value (₹) *
                    </label>
                    <input
                      type="number"
                      value={assetFormData.value}
                      onChange={(e) => setAssetFormData({ ...assetFormData, value: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="5000000"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={assetFormData.category}
                      onChange={(e) => setAssetFormData({ ...assetFormData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="realestate">Real Estate</option>
                      <option value="investments">Investments</option>
                      <option value="vehicles">Vehicles</option>
                      <option value="bank">Bank Account</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Purchase Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={assetFormData.purchaseDate}
                      onChange={(e) => setAssetFormData({ ...assetFormData, purchaseDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Annual Appreciation Rate (%) (Optional)
                    </label>
                    <input
                      type="number"
                      value={assetFormData.appreciationRate}
                      onChange={(e) => setAssetFormData({ ...assetFormData, appreciationRate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="5.5"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={assetFormData.notes}
                      onChange={(e) => setAssetFormData({ ...assetFormData, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {selectedDataType === 'income' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Income Source *
                    </label>
                    <input
                      type="text"
                      value={incomeFormData.source}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, source: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Tech Company Salary"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={incomeFormData.amount}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="50000"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Frequency *
                    </label>
                    <select
                      value={incomeFormData.frequency}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, frequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annually">Annually</option>
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={incomeFormData.category}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="salary">Salary</option>
                      <option value="investment">Investment</option>
                      <option value="gift">Gift</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={incomeFormData.date}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={incomeFormData.notes}
                      onChange={(e) => setIncomeFormData({ ...incomeFormData, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {selectedDataType === 'expense' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expense Name *
                    </label>
                    <input
                      type="text"
                      value={expenseFormData.name}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Groceries"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                      placeholder="5000"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={expenseFormData.category}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="shopping">Shopping</option>
                      <option value="housing">Housing</option>
                      <option value="transport">Transport</option>
                      <option value="food">Food</option>
                      <option value="health">Health</option>
                      <option value="travel">Travel</option>
                      <option value="utilities">Utilities</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Frequency *
                    </label>
                    <select
                      value={expenseFormData.frequency}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, frequency: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="monthly">Monthly</option>
                      <option value="annually">Annually</option>
                      <option value="weekly">Weekly</option>
                      <option value="daily">Daily</option>
                      <option value="once">One-time</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={expenseFormData.date}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isEssential"
                      checked={expenseFormData.isEssential}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, isEssential: e.target.checked })}
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isEssential" className="ml-2 block text-sm text-gray-900 dark:text-white">
                      This is an essential expense
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={expenseFormData.notes}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              {selectedDataType === 'liability' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Liability Name *
                    </label>
                    <input
                      type="text"
                      value={liabilityFormData.name}
                      onChange={(e) => setLiabilityFormData({ ...liabilityFormData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="e.g., Home Loan"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Outstanding Amount (₹) *
                    </label>
                    <input
                      type="number"
                      value={liabilityFormData.amount}
                      onChange={(e) => setLiabilityFormData({ ...liabilityFormData, amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="2500000"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      value={liabilityFormData.category}
                      onChange={(e) => setLiabilityFormData({ ...liabilityFormData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="homeloan">Home Loan</option>
                      <option value="carloan">Car Loan</option>
                      <option value="personalloan">Personal Loan</option>
                      <option value="creditcard">Credit Card</option>
                      <option value="education">Education Loan</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Interest Rate (%) (Optional)
                    </label>
                    <input
                      type="number"
                      value={liabilityFormData.interestRate}
                      onChange={(e) => setLiabilityFormData({ ...liabilityFormData, interestRate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="8.5"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={liabilityFormData.dueDate}
                      onChange={(e) => setLiabilityFormData({ ...liabilityFormData, dueDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Monthly Payment (₹) (Optional)
                    </label>
                    <input
                      type="number"
                      value={liabilityFormData.monthlyPayment}
                      onChange={(e) => setLiabilityFormData({ ...liabilityFormData, monthlyPayment: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="25000"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={liabilityFormData.notes}
                      onChange={(e) => setLiabilityFormData({ ...liabilityFormData, notes: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Additional details..."
                      rows={3}
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg hover:shadow-lg transition-all duration-200 ${
                    selectedDataType === 'asset'
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'
                      : selectedDataType === 'income'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                      : selectedDataType === 'expense'
                      ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
                      : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
                  }`}
                >
                  Add {selectedDataType.charAt(0).toUpperCase() + selectedDataType.slice(1)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyCalc; 
