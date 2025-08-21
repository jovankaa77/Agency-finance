import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { Order, Expense } from '../../types';
import { 
  getWeekRevenue, 
  getMonthRevenue, 
  getYearRevenue,
  getWeekExpenses,
  getMonthExpenses,
  getYearExpenses,
  getMonthlyRevenueData,
  getMonthlyExpenseData
} from '../../utils/calculations';

interface ProfitExpenseAnalysisProps {
  orders: Order[];
  expenses: Expense[];
  userType: 'agency' | 'worker';
}

const ProfitExpenseAnalysis: React.FC<ProfitExpenseAnalysisProps> = ({ 
  orders, 
  expenses, 
  userType 
}) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [viewType, setViewType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  // Generate years from 2020 to 2030
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  // Calculate data based on period type
  const analysisData = useMemo(() => {
    if (periodType === 'yearly') {
      // Yearly data for multiple years
      return years.map(year => {
        const yearRevenue = getYearRevenue(orders, year);
        const yearExpenses = userType === 'agency' ? getYearExpenses(expenses, year) : 0;
        const yearProfit = yearRevenue - yearExpenses;
        
        return {
          period: year.toString(),
          revenue: yearRevenue,
          expense: yearExpenses,
          profit: yearProfit
        };
      });
    } else if (periodType === 'monthly') {
      // Monthly data for selected year
      return months.map(month => {
        const monthRevenue = getMonthRevenue(orders, month.value - 1, selectedYear);
        const monthExpenses = userType === 'agency' ? getMonthExpenses(expenses, month.value - 1, selectedYear) : 0;
        const monthProfit = monthRevenue - monthExpenses;
        
        return {
          period: month.label.substring(0, 3),
          revenue: monthRevenue,
          expense: monthExpenses,
          profit: monthProfit
        };
      });
    } else {
      // Weekly data for selected month and year
      const weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth - 1);
      return Array.from({ length: weeksInMonth }, (_, i) => {
        const weekNumber = i + 1;
        const weekRevenue = getWeekRevenueForMonth(orders, selectedYear, selectedMonth - 1, weekNumber);
        const weekExpenses = userType === 'agency' ? getWeekExpensesForMonth(expenses, selectedYear, selectedMonth - 1, weekNumber) : 0;
        const weekProfit = weekRevenue - weekExpenses;
        
        return {
          period: `Week ${weekNumber}`,
          revenue: weekRevenue,
          expense: weekExpenses,
          profit: weekProfit
        };
      });
    }
  }, [orders, expenses, selectedYear, selectedMonth, periodType, userType]);

  // Helper functions for weekly calculations
  const getWeeksInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = lastDay.getDate();
    return Math.ceil(days / 7);
  };

  const getWeekRevenueForMonth = (orders: Order[], year: number, month: number, week: number) => {
    const startDate = new Date(year, month, (week - 1) * 7 + 1);
    const endDate = new Date(year, month, week * 7);
    
    return orders
      .filter(order => {
        const orderDate = new Date(order.orderDate);
        return order.status === 'Success' && 
               orderDate >= startDate && 
               orderDate <= endDate;
      })
      .reduce((sum, order) => sum + order.totalAmount, 0);
  };

  const getWeekExpensesForMonth = (expenses: Expense[], year: number, month: number, week: number) => {
    const startDate = new Date(year, month, (week - 1) * 7 + 1);
    const endDate = new Date(year, month, week * 7);
    
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expense.status === 'Success' && 
               expenseDate >= startDate && 
               expenseDate <= endDate;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Calculate totals
  const totalRevenue = analysisData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = analysisData.reduce((sum, item) => sum + item.expense, 0);
  const totalProfit = totalRevenue - totalExpenses;

  // Pie chart data
  const pieData = userType === 'agency' ? [
    { name: 'Revenue', value: totalRevenue, color: '#10b981' },
    { name: 'Expenses', value: totalExpenses, color: '#ef4444' }
  ] : [
    { name: 'Revenue', value: totalRevenue, color: '#10b981' }
  ];

  const summaryCards = userType === 'agency' ? [
    {
      title: `Total Revenue (${periodType})`,
      value: totalRevenue,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: `Total Expenses (${periodType})`,
      value: totalExpenses,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: `Net Profit (${periodType})`,
      value: totalProfit,
      icon: DollarSign,
      color: totalProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
    }
  ] : [
    {
      title: `Total Revenue (${periodType})`,
      value: totalRevenue,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {userType === 'agency' ? 'Profit & Expense Analysis' : 'Revenue Analysis'}
            </h3>
            <p className="text-gray-600">
              {userType === 'agency' 
                ? 'Analyze revenue, expenses, and profit trends with customizable date ranges'
                : 'Analyze revenue trends with customizable date ranges'
              }
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Period Type */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Period:</label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as 'weekly' | 'monthly' | 'yearly')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Year Selector */}
            {(periodType === 'monthly' || periodType === 'weekly') && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Year:</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Month Selector */}
            {periodType === 'weekly' && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Chart Type */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewType('bar')}
                className={`p-2 rounded-lg transition-colors ${
                  viewType === 'bar'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Bar Chart"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewType('line')}
                className={`p-2 rounded-lg transition-colors ${
                  viewType === 'line'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Line Chart"
              >
                <TrendingUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewType('pie')}
                className={`p-2 rounded-lg transition-colors ${
                  viewType === 'pie'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title="Pie Chart"
              >
                <PieChartIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={`grid ${userType === 'agency' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1'} gap-6`}>
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
              <div className="text-sm font-medium text-gray-600 mb-2">{card.title}</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(card.value)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {periodType.charAt(0).toUpperCase() + periodType.slice(1)} Analysis
          </h4>
          <p className="text-gray-600">
            {userType === 'agency' 
              ? 'Revenue, expenses, and profit comparison'
              : 'Revenue trends over time'
            }
          </p>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            {viewType === 'pie' ? (
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            ) : viewType === 'bar' ? (
              <BarChart data={analysisData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="period" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'revenue' ? 'Revenue' : name === 'expense' ? 'Expenses' : 'Profit'
                  ]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" name="revenue" radius={[2, 2, 0, 0]} />
                {userType === 'agency' && (
                  <>
                    <Bar dataKey="expense" fill="#ef4444" name="expense" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="profit" fill="#3b82f6" name="profit" radius={[2, 2, 0, 0]} />
                  </>
                )}
              </BarChart>
            ) : (
              <LineChart data={analysisData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="period" 
                  stroke="#6b7280"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={formatCurrency}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'revenue' ? 'Revenue' : name === 'expense' ? 'Expenses' : 'Profit'
                  ]}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="revenue"
                />
                {userType === 'agency' && (
                  <>
                    <Line 
                      type="monotone" 
                      dataKey="expense" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                      name="expense"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      name="profit"
                    />
                  </>
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                {userType === 'agency' && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expenses</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profit</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analysisData.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.period}</td>
                  <td className="px-4 py-3 text-sm text-green-600 font-semibold">{formatCurrency(item.revenue)}</td>
                  {userType === 'agency' && (
                    <>
                      <td className="px-4 py-3 text-sm text-red-600 font-semibold">{formatCurrency(item.expense)}</td>
                      <td className={`px-4 py-3 text-sm font-semibold ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.profit)}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfitExpenseAnalysis;