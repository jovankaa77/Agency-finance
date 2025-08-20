import { Order } from '../types';

export const calculateOrderTotal = (order: Omit<Order, 'totalAmount'> | Order): number => {
  return order.downPayments.reduce((sum, dp) => sum + (dp.amount || 0), 0);
};

export const getWeekRevenue = (orders: Order[]): number => {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  
  return orders
    .filter(order => 
      order.status === 'Success' && 
      new Date(order.orderDate) >= weekStart
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);
};

export const getMonthRevenue = (orders: Order[], month?: number, year?: number): number => {
  const targetMonth = month ?? new Date().getMonth();
  const targetYear = year ?? new Date().getFullYear();
  
  return orders
    .filter(order => {
      const orderDate = new Date(order.orderDate);
      return order.status === 'Success' && 
             orderDate.getMonth() === targetMonth && 
             orderDate.getFullYear() === targetYear;
    })
    .reduce((sum, order) => sum + order.totalAmount, 0);
};

export const getYearRevenue = (orders: Order[], year?: number): number => {
  const targetYear = year ?? new Date().getFullYear();
  
  return orders
    .filter(order => 
      order.status === 'Success' && 
      new Date(order.orderDate).getFullYear() === targetYear
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);
};

export const getMonthlyRevenueData = (orders: Order[]): { month: string; revenue: number }[] => {
  const currentYear = new Date().getFullYear();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return months.map((month, index) => ({
    month,
    revenue: getMonthRevenue(orders, index, currentYear)
  }));
};