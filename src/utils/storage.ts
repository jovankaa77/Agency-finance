import { Agency, Order } from '../types';

const AGENCIES_KEY = 'creative_agencies';
const ORDERS_KEY = 'agency_orders';

export const storage = {
  // Agency management
  getAgencies(): Agency[] {
    const data = localStorage.getItem(AGENCIES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveAgency(agency: Agency): void {
    const agencies = this.getAgencies();
    agencies.push(agency);
    localStorage.setItem(AGENCIES_KEY, JSON.stringify(agencies));
  },

  findAgency(name: string, password: string): Agency | null {
    const agencies = this.getAgencies();
    return agencies.find(a => a.name === name && a.password === password) || null;
  },

  agencyExists(name: string): boolean {
    const agencies = this.getAgencies();
    return agencies.some(a => a.name === name);
  },

  // Order management
  getOrders(agencyId: string): Order[] {
    const data = localStorage.getItem(ORDERS_KEY);
    const allOrders: Order[] = data ? JSON.parse(data) : [];
    return allOrders.filter(order => order.agencyId === agencyId);
  },

  saveOrder(order: Order): void {
    const data = localStorage.getItem(ORDERS_KEY);
    const allOrders: Order[] = data ? JSON.parse(data) : [];
    allOrders.push(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(allOrders));
  },

  updateOrder(updatedOrder: Order): void {
    const data = localStorage.getItem(ORDERS_KEY);
    const allOrders: Order[] = data ? JSON.parse(data) : [];
    const index = allOrders.findIndex(order => order.id === updatedOrder.id);
    if (index !== -1) {
      allOrders[index] = updatedOrder;
      localStorage.setItem(ORDERS_KEY, JSON.stringify(allOrders));
    }
  },

  deleteOrder(orderId: string): void {
    const data = localStorage.getItem(ORDERS_KEY);
    const allOrders: Order[] = data ? JSON.parse(data) : [];
    const filteredOrders = allOrders.filter(order => order.id !== orderId);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(filteredOrders));
  }
};