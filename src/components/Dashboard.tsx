import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Order, Expense } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';
import { 
  getWeekRevenue, 
  getMonthRevenue, 
  getYearRevenue, 
  getMonthlyRevenueData,
  getWeekExpenses,
  getMonthExpenses,
  getYearExpenses,
  calculateExpenseTotal,
  getDailyAnalysisData
} from '../utils/calculations';
import RevenueCards from './dashboard/RevenueCards';
import OrderForm from './dashboard/OrderForm';
import OrderTable from './dashboard/OrderTable';
import RevenueChart from './dashboard/RevenueChart';
import ExpenseAnalysis from './dashboard/ExpenseAnalysis';
import DailyAnalysis from './dashboard/DailyAnalysis';
import Header from './dashboard/Header';

const Dashboard: React.FC = () => {
  const { currentAgency, currentWorker, userType } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'expenses' | 'analysis'>('orders');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentAgency || currentWorker) {
      loadOrders();
      if (userType === 'agency') {
        loadExpenses();
      }
    }
  }, [currentAgency, currentWorker]);

  const loadOrders = async () => {
    if (currentAgency || currentWorker) {
      setLoading(true);
      try {
        let fetchedOrders: Order[];
        if (userType === 'agency' && currentAgency) {
          fetchedOrders = await firebaseStorage.getOrders(currentAgency.id);
        } else if (userType === 'worker' && currentWorker) {
          fetchedOrders = await firebaseStorage.getOrdersByWorker(currentWorker.id);
        } else {
          fetchedOrders = [];
        }
        setOrders(fetchedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const loadExpenses = async () => {
    if (currentAgency) {
      try {
        const fetchedExpenses = await firebaseStorage.getExpenses(currentAgency.id);
        setExpenses(fetchedExpenses);
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    }
  };

  const handleOrderSubmit = async (order: Omit<Order, 'id'>) => {
    try {
      await firebaseStorage.saveOrder(order);
      await loadOrders();
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const handleOrderUpdate = async (updatedOrder: Order) => {
    try {
      await firebaseStorage.updateOrder(updatedOrder.id, updatedOrder);
      await loadOrders();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleOrderDelete = async (orderId: string) => {
    try {
      await firebaseStorage.deleteOrder(orderId);
      await loadOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  const handleExpenseSubmit = async (expense: Omit<Expense, 'id'>) => {
    try {
      await firebaseStorage.saveExpense(expense);
      await loadExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const handleExpenseUpdate = async (updatedExpense: Expense) => {
    try {
      await firebaseStorage.updateExpense(updatedExpense.id, updatedExpense);
      await loadExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleExpenseDelete = async (expenseId: string) => {
    try {
      await firebaseStorage.deleteExpense(expenseId);
      await loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  if (!currentAgency && !currentWorker) return null;

  const currentUser = currentAgency || currentWorker;
  const isAgency = userType === 'agency';
  
  const weeklyRevenue = getWeekRevenue(orders);
  const monthlyRevenue = getMonthRevenue(orders);
  const yearlyRevenue = getYearRevenue(orders);
  const weeklyExpenses = getWeekExpenses(expenses);
  const monthlyExpenses = getMonthExpenses(expenses);
  const yearlyExpenses = getYearExpenses(expenses);
  const totalExpenses = calculateExpenseTotal(expenses);
  const chartData = getMonthlyRevenueData(orders);
  const dailyAnalysisData = getDailyAnalysisData(orders, expenses);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {currentUser?.name}
          </h1>
          <p className="text-gray-600">
            {isAgency ? "Here's your agency's financial overview and recent activity" : "Here's your work overview and recent activity"}
          </p>
        </div>

        {/* Revenue Cards */}
        <RevenueCards 
          weeklyRevenue={weeklyRevenue}
          monthlyRevenue={monthlyRevenue}
          yearlyRevenue={yearlyRevenue}
          weeklyExpenses={weeklyExpenses}
          monthlyExpenses={monthlyExpenses}
          yearlyExpenses={yearlyExpenses}
          weeklyProfit={weeklyRevenue - weeklyExpenses}
          monthlyProfit={monthlyRevenue - monthlyExpenses}
          yearlyProfit={yearlyRevenue - yearlyExpenses}
          isAgency={isAgency}
        />

        {/* Chart Section */}
        <div className="mb-8">
          <RevenueChart data={chartData} />
        </div>

        {/* Tab Navigation */}
        {isAgency && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'orders'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Order Management
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'expenses'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Expense Analysis
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analysis'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Daily Analysis
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Content based on active tab */}
        {(!isAgency || activeTab === 'orders') && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Order Management</h2>
                <p className="text-gray-600 mt-1">
                  {isAgency ? 'Track and manage all agency orders' : 'Track and manage your orders'}
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                + Add New Order
              </button>
            </div>
          </div>

          <OrderTable 
            orders={orders}
            onOrderUpdate={handleOrderUpdate}
            onOrderDelete={handleOrderDelete}
            agencyName={currentUser?.name || ''}
            userType={userType || 'agency'}
          />
        </div>
        )}

        {/* Expense Analysis Tab */}
        {isAgency && activeTab === 'expenses' && (
          <ExpenseAnalysis
            expenses={expenses}
            onExpenseSubmit={handleExpenseSubmit}
            onExpenseUpdate={handleExpenseUpdate}
            onExpenseDelete={handleExpenseDelete}
            agencyId={currentAgency?.id || ''}
            agencyName={currentAgency?.name || ''}
          />
        )}

        {/* Daily Analysis Tab */}
        {isAgency && activeTab === 'analysis' && (
          <DailyAnalysis
            data={dailyAnalysisData}
            orders={orders}
            expenses={expenses}
          />
        )}

        {/* Order Form Modal */}
        {isFormOpen && (
          <OrderForm
            onSubmit={handleOrderSubmit}
            onClose={() => setIsFormOpen(false)}
            agencyId={currentAgency?.id || currentWorker?.agencyId || ''}
            workerId={currentWorker?.id}
            workerName={currentWorker?.name}
            userType={userType || 'agency'}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;