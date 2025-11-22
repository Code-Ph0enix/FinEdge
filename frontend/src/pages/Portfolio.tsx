/**
 * FinEdge Portfolio Dashboard - ENHANCED VERSION
 * MongoDB Connected with Advanced Visualizations
 * 
 * @version 4.0.0 - Full Feature Set
 */

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/clerk-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, Area, AreaChart
} from 'recharts';
import { 
  Wallet, TrendingUp, IndianRupee, 
  Target, AlertTriangle, Loader2, TrendingDown, Shield,
  Activity, Check, Clock, Home, Car, CreditCard, Calendar
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SERVER_URL } from '../utils/utils';

const parseCurrency = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const sanitized = value.replace(/[₹,\s]/g, '');
    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const isSameMonth = (inputDate: string | null | undefined, target: Date): boolean => {
  if (!inputDate) return false;
  const date = new Date(inputDate);
  return date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();
};

const getLastMonths = (count = 6): Date[] => {
  const months: Date[] = [];
  const current = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(new Date(current.getFullYear(), current.getMonth() - i, 1));
  }
  return months;
};

interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
  category: string;
  date: string;
}

interface Expense {
  id: string;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time';
  category: string;
  isEssential: boolean;
  date: string;
}

interface Asset {
  id: string;
  name: string;
  value: number;
  category: string;
}

interface Liability {
  id: string;
  name: string;
  amount: number;
  category: string;
  monthlyPayment?: number;
  interestRate?: number;
}

interface Goal {
  id: string;
  name: string;
  target: string;
  current: string;
  icon: string;
}

const normalizeIncome = (doc: any): Income => ({
  id: doc?.id ?? doc?._id ?? '',
  source: doc?.source ?? '',
  amount: parseCurrency(doc?.amount),
  frequency: (doc?.frequency ?? 'monthly') as Income['frequency'],
  category: doc?.category ?? 'other',
  date: doc?.date ?? new Date().toISOString().split('T')[0],
});

const normalizeExpense = (doc: any): Expense => ({
  id: doc?.id ?? doc?._id ?? '',
  name: doc?.name ?? '',
  amount: parseCurrency(doc?.amount),
  frequency: (doc?.frequency ?? 'monthly') as Expense['frequency'],
  category: doc?.category ?? 'other',
  isEssential: Boolean(doc?.isEssential),
  date: doc?.date ?? new Date().toISOString().split('T')[0],
});

const normalizeAsset = (doc: any): Asset => ({
  id: doc?.id ?? doc?._id ?? '',
  name: doc?.name ?? '',
  value: parseCurrency(doc?.value),
  category: doc?.category ?? 'other',
});

const normalizeLiability = (doc: any): Liability => ({
  id: doc?.id ?? doc?._id ?? '',
  name: doc?.name ?? '',
  amount: parseCurrency(doc?.amount),
  category: doc?.category ?? 'other',
  monthlyPayment: doc?.monthlyPayment !== undefined ? parseCurrency(doc.monthlyPayment) : undefined,
  interestRate: doc?.interestRate !== undefined ? parseCurrency(doc.interestRate) : undefined,
});

const normalizeGoal = (doc: any): Goal => ({
  id: doc?.id ?? doc?._id ?? '',
  name: doc?.name ?? '',
  target: doc?.target ?? '0',
  current: doc?.current ?? '0',
  icon: doc?.icon ?? '🎯',
});

const getMonthlyIncomeValue = (entry: Income): number => {
  switch (entry.frequency) {
    case 'monthly':
      return entry.amount;
    case 'yearly':
      return entry.amount / 12;
    default:
      return 0;
  }
};

const getMonthlyExpenseValue = (entry: Expense): number => {
  switch (entry.frequency) {
    case 'monthly':
      return entry.amount;
    case 'yearly':
      return entry.amount / 12;
    case 'weekly':
      return entry.amount * 4;
    case 'daily':
      return entry.amount * 30;
    default:
      return 0;
  }
};

const Portfolio = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  
  // User data from MongoDB
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Fetch all financial data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);

        const [incomeRes, expensesRes, assetsRes, liabilitiesRes, goalsRes] = await Promise.all([
          fetch(`${SERVER_URL}/api/user-profile/income?clerkUserId=${user.id}`),
          fetch(`${SERVER_URL}/api/user-profile/expenses?clerkUserId=${user.id}`),
          fetch(`${SERVER_URL}/api/user-profile/assets?clerkUserId=${user.id}`),
          fetch(`${SERVER_URL}/api/user-profile/liabilities?clerkUserId=${user.id}`),
          fetch(`${SERVER_URL}/api/user-profile/goals?clerkUserId=${user.id}`)
        ]);

        if (incomeRes.ok) {
          const data = await incomeRes.json();
          setIncome(Array.isArray(data.income) ? data.income.map(normalizeIncome) : []);
        }

        if (expensesRes.ok) {
          const data = await expensesRes.json();
          setExpenses(Array.isArray(data.expenses) ? data.expenses.map(normalizeExpense) : []);
        }

        if (assetsRes.ok) {
          const data = await assetsRes.json();
          setAssets(Array.isArray(data.assets) ? data.assets.map(normalizeAsset) : []);
        }

        if (liabilitiesRes.ok) {
          const data = await liabilitiesRes.json();
          setLiabilities(Array.isArray(data.liabilities) ? data.liabilities.map(normalizeLiability) : []);
        }

        if (goalsRes.ok) {
          const data = await goalsRes.json();
          setGoals(Array.isArray(data.goals) ? data.goals.map(normalizeGoal) : []);
        }

      } catch (error) {
        console.error('Error fetching portfolio data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  const lastSixMonths = useMemo(() => getLastMonths(6), []);

  const monthlyIncome = useMemo(
    () => income.reduce((sum, inc) => sum + getMonthlyIncomeValue(inc), 0),
    [income]
  );

  const monthlyExpenses = useMemo(
    () => expenses.reduce((sum, exp) => sum + getMonthlyExpenseValue(exp), 0),
    [expenses]
  );

  const { totalAssets, totalLiabilities, netWorth } = useMemo(() => {
    const assetsTotal = assets.reduce((sum, asset) => sum + asset.value, 0);
    const liabilitiesTotal = liabilities.reduce((sum, liability) => sum + liability.amount, 0);
    return {
      totalAssets: assetsTotal,
      totalLiabilities: liabilitiesTotal,
      netWorth: assetsTotal - liabilitiesTotal,
    };
  }, [assets, liabilities]);

  const monthlySavings = useMemo(() => monthlyIncome - monthlyExpenses, [monthlyIncome, monthlyExpenses]);

  const savingsRate = useMemo(
    () => (monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0),
    [monthlyIncome, monthlySavings]
  );

  const diversificationScore = useMemo(() => {
    if (assets.length === 0) {
      return 0;
    }

    const categories = new Set(assets.map((a) => a.category));
    return Math.min((categories.size / 5) * 100, 100);
  }, [assets]);

  const riskScore = useMemo(() => {
    const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
    const baseScore = 100 - debtToAssetRatio;
    const diversityBonus = diversificationScore * 0.2;
    return Math.max(Math.min(baseScore + diversityBonus, 100), 0);
  }, [totalAssets, totalLiabilities, diversificationScore]);

  const portfolioHealth = useMemo(
    () => Math.round((riskScore + diversificationScore) / 2),
    [riskScore, diversificationScore]
  );

  const assetsByCategory = useMemo(() => {
    return assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + asset.value;
      return acc;
    }, {} as Record<string, number>);
  }, [assets]);

  const assetAllocationData = useMemo(() => {
    return Object.entries(assetsByCategory).map(([name, value]) => ({
      name:
        name === 'realestate'
          ? 'Real Estate'
          : name === 'investments'
          ? 'Investments'
          : name === 'vehicles'
          ? 'Vehicles'
          : name === 'bank'
          ? 'Bank'
          : name === 'cash'
          ? 'Cash'
          : 'Other',
      value: Math.round(value),
      percentage: totalAssets > 0 ? ((value / totalAssets) * 100).toFixed(1) : 0,
    }));
  }, [assetsByCategory, totalAssets]);

  const expensesByCategory = useMemo(() => {
    return expenses.reduce((acc, exp) => {
      const recurringAmount = getMonthlyExpenseValue(exp);
      const oneTimeAmount = exp.frequency === 'one-time' && exp.date ? exp.amount : 0;
      acc[exp.category] = (acc[exp.category] || 0) + recurringAmount + oneTimeAmount;
      return acc;
    }, {} as Record<string, number>);
  }, [expenses]);

  const expenseChartData = useMemo(() => {
    return Object.entries(expensesByCategory).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value),
    }));
  }, [expensesByCategory]);

  const activityItems = useMemo(() => {
    const incomeActivities = income.map((entry) => ({
      ...entry,
      type: 'income' as const,
    }));

    const expenseActivities = expenses.map((entry) => ({
      ...entry,
      type: 'expense' as const,
    }));

    return [...incomeActivities, ...expenseActivities].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [income, expenses]);

  const displayedActivity = useMemo(
    () => (showAllActivity ? activityItems : activityItems.slice(0, 4)),
    [activityItems, showAllActivity]
  );

  const incomeVsExpensesData = useMemo(() => {
    return lastSixMonths.map((date) => {
      const monthIncomeTotal = income.reduce((sum, inc) => {
        if (inc.frequency === 'one-time') {
          return sum + (isSameMonth(inc.date, date) ? inc.amount : 0);
        }
        return sum + getMonthlyIncomeValue(inc);
      }, 0);

      const monthExpenseTotal = expenses.reduce((sum, exp) => {
        if (exp.frequency === 'one-time') {
          return sum + (isSameMonth(exp.date, date) ? exp.amount : 0);
        }
        return sum + getMonthlyExpenseValue(exp);
      }, 0);

      return {
        name: date.toLocaleString('default', { month: 'short' }),
        income: Math.max(0, Math.round(monthIncomeTotal)),
        expenses: Math.max(0, Math.round(monthExpenseTotal)),
        savings: Math.round(monthIncomeTotal - monthExpenseTotal),
      };
    });
  }, [lastSixMonths, income, expenses]);

  const performanceData = useMemo(() => {
    if (incomeVsExpensesData.length === 0) {
      return [];
    }

    const totalNetFlow = incomeVsExpensesData.reduce(
      (sum, item) => sum + (item.income - item.expenses),
      0
    );

    let cumulativeFlow = 0;
    const baseline = netWorth - totalNetFlow;

    return incomeVsExpensesData.map((item) => {
      cumulativeFlow += item.income - item.expenses;
      return {
        name: item.name,
        value: Math.max(baseline + cumulativeFlow, 0),
      };
    });
  }, [incomeVsExpensesData, netWorth]);

  const riskAnalysisData = useMemo(() => {
    const liquidAssetsValue = assets
      .filter((asset) => asset.category === 'cash' || asset.category === 'bank')
      .reduce((sum, asset) => sum + asset.value, 0);

    const liquidityScore = totalAssets > 0 ? Math.min((liquidAssetsValue / totalAssets) * 100, 100) : 50;
    const sharpeRatio = savingsRate > 0 ? Math.min(savingsRate * 2, 100) : 30;
    const alpha = Math.min(Math.max(50 + (monthlySavings / Math.max(monthlyExpenses, 1)) * 10, 0), 100);
    const beta = Math.min(Math.max(80 - diversificationScore / 2, 0), 100);

    return [
      { metric: 'Volatility', value: Math.min(diversificationScore, 100) },
      { metric: 'Liquidity', value: liquidityScore },
      { metric: 'Sharpe Ratio', value: sharpeRatio },
      { metric: 'Alpha', value: alpha },
      { metric: 'Beta', value: beta },
    ];
  }, [assets, totalAssets, diversificationScore, savingsRate, monthlySavings, monthlyExpenses]);

  const overallGoalProgress = useMemo(() => {
    if (goals.length === 0) {
      return 0;
    }

    const totalProgress = goals.reduce((sum, goal) => {
      const current = parseCurrency(goal.current);
      const target = parseCurrency(goal.target);
      return sum + (target > 0 ? (current / target) * 100 : 0);
    }, 0);

    return totalProgress / goals.length;
  }, [goals]);

  const topExpenseCategory = useMemo(() => {
    if (expenseChartData.length === 0) {
      return null;
    }

    return expenseChartData.reduce((largest, current) =>
      current.value > largest.value ? current : largest
    );
  }, [expenseChartData]);

  const monthOverMonthChange = useMemo(() => {
    if (incomeVsExpensesData.length < 2) {
      return null;
    }

    const previous = incomeVsExpensesData[incomeVsExpensesData.length - 2];
    const latest = incomeVsExpensesData[incomeVsExpensesData.length - 1];
    const previousNet = previous.income - previous.expenses;
    const latestNet = latest.income - latest.expenses;

    if (previousNet === 0) {
      return null;
    }

    return ((latestNet - previousNet) / Math.abs(previousNet)) * 100;
  }, [incomeVsExpensesData]);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portfolio Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your complete financial snapshot</p>
        </div>
      </div>

      {/* Top Row - My Wealth + Asset Allocation + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Wealth Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">My Wealth</h3>
            <Wallet className="w-6 h-6" />
          </div>
          <p className="text-4xl font-bold mb-2">₹{netWorth.toLocaleString('en-IN')}</p>
          <div className="flex items-center gap-2 text-sm">
            {monthOverMonthChange !== null ? (
              <>
                {monthOverMonthChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-200" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-200" />
                )}
                <span className={monthOverMonthChange >= 0 ? 'text-green-100' : 'text-red-100'}>
                  {monthOverMonthChange >= 0 ? '+' : ''}{monthOverMonthChange.toFixed(1)}% vs previous month
                </span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 text-white/70" />
                <span className="text-white/80">No previous month data</span>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/20">
            <div>
              <p className="text-xs opacity-80">Monthly Returns</p>
              <p className="text-lg font-bold">₹{monthlySavings.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-xs opacity-80">Risk Score</p>
              <p className="text-lg font-bold">{riskScore.toFixed(0)}/100</p>
            </div>
          </div>
        </motion.div>

        {/* Asset Allocation Donut */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Asset Allocation</h3>
            <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              Rebalance
            </button>
          </div>
          {assetAllocationData.length > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={assetAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {assetAllocationData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500">
              No assets
            </div>
          )}
          <div className="mt-4 space-y-2">
            {assetAllocationData.slice(0, 4).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Portfolio Health Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Portfolio Health</h3>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Overall Health</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{portfolioHealth}/100</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all"
                style={{ width: `${portfolioHealth}%` }}
              />
            </div>
          </div>
          
          {/* Diversification Score */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Diversification Score</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{diversificationScore.toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                style={{ width: `${diversificationScore}%` }}
              />
            </div>
          </div>

          {/* Risk Score */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Risk Score</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{riskScore.toFixed(0)}/100</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </div>

          {/* Goal Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Goal Progress</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{overallGoalProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                style={{ width: `${overallGoalProgress}%` }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Middle Row - Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Monthly Returns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
            <Activity className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Returns</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            ₹{monthlySavings.toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">+12.5% vs last month</p>
        </motion.div>

        {/* Risk Score Gauge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Shield className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <AlertTriangle className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Risk Score</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{riskScore.toFixed(0)}/100</p>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-yellow-500 h-1.5 rounded-full"
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </motion.div>

        {/* Goal Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between mb-4">
            <Target className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <Check className="w-5 h-5 text-gray-400 dark:text-gray-300" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Goal Progress</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{overallGoalProgress.toFixed(1)}%</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">{goals.length} active goals</p>
        </motion.div>

        {/* Savings Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`rounded-xl p-6 shadow-sm border ${
            savingsRate >= 0 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white border-green-200' 
              : 'bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <IndianRupee className="w-8 h-8" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded">{savingsRate.toFixed(1)}%</span>
          </div>
          <p className="text-sm opacity-90 mb-1">Savings Rate</p>
          <p className="text-3xl font-bold">₹{monthlySavings.toLocaleString('en-IN')}</p>
          {topExpenseCategory && (
            <p className="text-xs opacity-80 mt-2">
              Biggest expense: {topExpenseCategory.name} (₹{topExpenseCategory.value.toLocaleString('en-IN')}/mo)
            </p>
          )}
        </motion.div>
      </div>

      {/* **CONTINUE IN PART 2** */}
      {/* Investment Goals Timeline */}
      {goals.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Investment Goals</h3>
            <button className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {goals.slice(0, 3).map((goal, index) => {
              const current = parseFloat(goal.current.replace(/[₹,]/g, ''));
              const target = parseFloat(goal.target.replace(/[₹,]/g, ''));
              const progress = target > 0 ? (current / target) * 100 : 0;
              const timeframes = ['20 years', '5 years', '1 year', '10 years'];
              
              return (
                <div key={goal.id} className="relative">
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                        {timeframes[index % timeframes.length]}
                      </span>
                      <Clock className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">{goal.name}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Target:</span>
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          ₹{target.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Current:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ₹{current.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {progress.toFixed(1)}% Complete
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Charts Row 1 - Portfolio Performance + Income vs Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Performance Line Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Portfolio Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#4F46E5" 
                fillOpacity={1} 
                fill="url(#colorValue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Income vs Expenses Bar Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeVsExpensesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
              />
              <Bar dataKey="income" fill="#10B981" name="Income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savings" fill="#4F46E5" name="Savings" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 - Risk Analysis + Liabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Analysis Radar Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Risk Analysis</h3>
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full font-semibold">
              Risk Score: {riskScore.toFixed(0)}/100
            </span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={riskAnalysisData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="metric" stroke="#6B7280" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#6B7280" />
              <Radar 
                name="Risk Metrics" 
                dataKey="value" 
                stroke="#4F46E5" 
                fill="#4F46E5" 
                fillOpacity={0.6} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: 'Volatility', value: riskAnalysisData[0].value.toFixed(2) },
              { label: 'Sharpe Ratio', value: riskAnalysisData[2].value.toFixed(2) },
              { label: 'Alpha', value: riskAnalysisData[3].value.toFixed(2) },
              { label: 'Beta', value: riskAnalysisData[4].value.toFixed(2) }
            ].map((metric) => (
              <div key={metric.label} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{metric.label}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{metric.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Liabilities Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Liabilities Overview</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Total Debt: ₹{totalLiabilities.toLocaleString('en-IN')}
            </span>
          </div>
          {liabilities.length > 0 ? (
            <div className="space-y-3">
              {liabilities.slice(0, 4).map((liability) => {
                const icons = {
                  homeloan: Home,
                  carloan: Car,
                  creditcard: CreditCard,
                  personalloan: IndianRupee,
                  education: Target,
                  other: Activity
                };
                const Icon = icons[liability.category as keyof typeof icons] || Activity;
                
                return (
                  <div key={liability.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Icon className="w-5 h-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {liability.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span className="capitalize">{liability.category.replace(/([A-Z])/g, ' $1').trim()}</span>
                          {liability.interestRate && (
                            <>
                              <span>•</span>
                              <span>{liability.interestRate}% APR</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 dark:text-red-400">
                        ₹{liability.amount.toLocaleString('en-IN')}
                      </p>
                      {liability.monthlyPayment && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ₹{liability.monthlyPayment.toLocaleString('en-IN')}/mo
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No liabilities recorded</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h3>
          {activityItems.length > 4 && (
            <button
              onClick={() => setShowAllActivity((prev) => !prev)}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showAllActivity ? 'Show Less' : 'View All'}
            </button>
          )}
        </div>
        <div className="space-y-3">
          {displayedActivity.length > 0 ? (
            displayedActivity.map((item) => {
              const isIncome = item.type === 'income';
              const name = isIncome ? item.source : item.name;
              const amountLabel = `${isIncome ? '+' : '-'}₹${item.amount.toLocaleString('en-IN')}`;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isIncome ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">
                        {name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(item.date).toLocaleDateString('en-IN')}</span>
                        <span>•</span>
                        <span className={isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {isIncome ? 'Income' : 'Expense'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {amountLabel}
                    </p>
                    <div
                      className={`px-2 py-1 rounded text-xs ${
                        isIncome
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                    >
                      Completed
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-gray-500 dark:text-gray-400">
              <Activity className="w-8 h-8 mb-2 opacity-60" />
              <p>No recent activity recorded</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Alert if no data */}
      {income.length === 0 && expenses.length === 0 && assets.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                Get Started with Your Financial Data
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Head over to <strong>My Data</strong> section to add your income sources, expenses, assets, and liabilities. 
                This will populate your dashboard with personalized insights and beautiful visualizations.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Portfolio;

// End of frontend/src/pages/Portfolio.tsx
