import { Order } from '../types';
import { Expense } from '../types';

export const calculateOrderTotal = (order: Omit<Order, 'totalAmount'> | Order): number => {
  return order.downPayments.reduce((sum, dp) => sum + (dp.amount || 0), 0);
};

export const calculateExpenseTotal = (expenses: Expense[]): number => {
  return expenses
    .filter(expense => expense.status === 'Success')
    .reduce((sum, expense) => sum + expense.amount, 0);
};

export const getDailyRevenue = (orders: Order[], date: string): number => {
  return orders
    .filter(order => 
      order.status === 'Success' && 
      order.orderDate === date
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);
};

export const getDailyExpenses = (expenses: Expense[], date: string): number => {
  return expenses
    .filter(expense => 
      expense.status === 'Success' && 
      expense.date === date
    )
    .reduce((sum, expense) => sum + expense.amount, 0);
};

export const getDailyProfit = (orders: Order[], expenses: Expense[], date: string): number => {
  const revenue = getDailyRevenue(orders, date);
  const expenseAmount = getDailyExpenses(expenses, date);
  return revenue - expenseAmount;
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

export const getWeekExpenses = (expenses: Expense[]): number => {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  
  return expenses
    .filter(expense => 
      expense.status === 'Success' && 
      new Date(expense.date) >= weekStart
    )
    .reduce((sum, expense) => sum + expense.amount, 0);
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

export const getMonthExpenses = (expenses: Expense[], month?: number, year?: number): number => {
  const targetMonth = month ?? new Date().getMonth();
  const targetYear = year ?? new Date().getFullYear();
  
  return expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expense.status === 'Success' && 
             expenseDate.getMonth() === targetMonth && 
             expenseDate.getFullYear() === targetYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
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

export const getYearExpenses = (expenses: Expense[], year?: number): number => {
  const targetYear = year ?? new Date().getFullYear();
  
  return expenses
    .filter(expense => 
      expense.status === 'Success' && 
      new Date(expense.date).getFullYear() === targetYear
    )
    .reduce((sum, expense) => sum + expense.amount, 0);
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

export const getMonthlyExpenseData = (expenses: Expense[]): { month: string; expense: number }[] => {
  const currentYear = new Date().getFullYear();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  return months.map((month, index) => ({
    month,
    expense: getMonthExpenses(expenses, index, currentYear)
  }));
};

export const getDailyAnalysisData = (orders: Order[], expenses: Expense[], days: number = 7): { 
  date: string; 
  revenue: number; 
  expense: number; 
  profit: number; 
}[] => {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    const revenue = getDailyRevenue(orders, dateString);
    const expense = getDailyExpenses(expenses, dateString);
    const profit = revenue - expense;
    
    data.push({
      date: dateString,
      revenue,
      expense,
      profit
    });
  }
  
  return data;
};

export const getWeeksInMonth = (year: number, month: number): number => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = lastDay.getDate();
  return Math.ceil(days / 7);
};

export const getWeekRevenueForMonth = (orders: Order[], year: number, month: number, week: number): number => {
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

export const getWeekExpensesForMonth = (expenses: Expense[], year: number, month: number, week: number): number => {
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