import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Order } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';
import { getWeekRevenue, getMonthRevenue, getYearRevenue, getMonthlyRevenueData } from '../utils/calculations';
import RevenueCards from './dashboard/RevenueCards';
import OrderForm from './dashboard/OrderForm';
import OrderTable from './dashboard/OrderTable';
import RevenueChart from './dashboard/RevenueChart';
import Header from './dashboard/Header';

const Dashboard: React.FC = () => {
  const { currentAgency, currentWorker, userType } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentAgency || currentWorker) {
      loadOrders();
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

  if (!currentAgency && !currentWorker) return null;

  const currentUser = currentAgency || currentWorker;
  const isAgency = userType === 'agency';
  
  const weeklyRevenue = getWeekRevenue(orders);
  const monthlyRevenue = getMonthRevenue(orders);
  const yearlyRevenue = getYearRevenue(orders);
  const chartData = getMonthlyRevenueData(orders);

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
        />

        {/* Chart Section */}
        <div className="mb-8">
          <RevenueChart data={chartData} />
        </div>

        {/* Orders Section */}
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