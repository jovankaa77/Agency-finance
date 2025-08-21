import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Order, Expense } from '../../types';
import { getDailyRevenue, getDailyExpenses, getDailyProfit } from '../../utils/calculations';

interface DailyAnalysisProps {
  data: { date: string; revenue: number; expense: number; profit: number }[];
  orders: Order[];
  expenses: Expense[];
}

const DailyAnalysis: React.FC<DailyAnalysisProps> = ({ data, orders, expenses }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewType, setViewType] = useState<'bar' | 'line'>('bar');

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short'
    });
  };

  // Get data for selected date
  const selectedDateRevenue = getDailyRevenue(orders, selectedDate);
  const selectedDateExpenses = getDailyExpenses(expenses, selectedDate);
  const selectedDateProfit = getDailyProfit(orders, expenses, selectedDate);

  // Get orders and expenses for selected date
  const selectedDateOrders = orders.filter(order => 
    order.orderDate === selectedDate && order.status === 'Success'
  );
  const selectedDateExpenseList = expenses.filter(expense => 
    expense.date === selectedDate && expense.status === 'Success'
  );

  // Calculate totals
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = data.reduce((sum, item) => sum + item.expense, 0);
  const totalProfit = totalRevenue - totalExpenses;

  const summaryCards = [
    {
      title: 'Total Revenue',
      value: totalRevenue,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Expenses',
      value: totalExpenses,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Net Profit',
      value: totalProfit,
      icon: DollarSign,
      color: totalProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: totalProfit >= 0 ? 'bg-green-50' : 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Chart Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Daily Financial Analysis</h3>
            <p className="text-gray-600">Revenue, expenses, and profit trends over time</p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <button
              onClick={() => setViewType('bar')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewType === 'bar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Bar Chart
            </button>
            <button
              onClick={() => setViewType('line')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewType === 'line'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Line Chart
            </button>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {viewType === 'bar' ? (
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={formatDate}
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
                  labelFormatter={(date: string) => `Date: ${formatDate(date)}`}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="revenue" fill="#10b981" name="revenue" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expense" fill="#ef4444" name="expense" radius={[2, 2, 0, 0]} />
                <Bar dataKey="profit" fill="#3b82f6" name="profit" radius={[2, 2, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={formatDate}
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
                  labelFormatter={(date: string) => `Date: ${formatDate(date)}`}
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
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Date Selector and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Date Selector */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center mb-4">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(selectedDateRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Expenses:</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(selectedDateExpenses)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium text-gray-900">Net Profit:</span>
              <span className={`font-bold ${selectedDateProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(selectedDateProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Orders for Selected Date */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Orders ({formatDate(selectedDate)})
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {selectedDateOrders.length === 0 ? (
              <p className="text-gray-500 text-sm">No orders for this date</p>
            ) : (
              selectedDateOrders.map((order) => (
                <div key={order.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">#{order.orderId}</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-xs text-gray-500">{order.orderType}</p>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses for Selected Date */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Expenses ({formatDate(selectedDate)})
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {selectedDateExpenseList.length === 0 ? (
              <p className="text-gray-500 text-sm">No expenses for this date</p>
            ) : (
              selectedDateExpenseList.map((expense) => (
                <div key={expense.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{expense.orderId}</p>
                      <p className="text-sm text-gray-600">{expense.customerName}</p>
                      <p className="text-xs text-gray-500">{expense.orderType}</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyAnalysis;