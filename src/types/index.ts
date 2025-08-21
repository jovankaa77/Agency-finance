export interface Agency {
  id: string;
  name: string;
  password: string;
  createdAt: Date;
}

export interface Worker {
  id: string;
  name: string;
  password: string;
  agencyId: string;
  createdAt: Date;
}

export interface DownPayment {
  id: string;
  amount?: number;
  label: string;
}

export interface Expense {
  id: string;
  orderId: string;
  customerName: string;
  orderType: string;
  date: string;
  amount: number;
  status: 'Proses' | 'Success';
  agencyId: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  orderId: number;
  agencyId: string;
  workerId?: string;
  workerName?: string;
  orderDate: string;
  deadline: string;
  customerName: string;
  orderType: string;
  downPayments: DownPayment[];
  baseAmount: number;
  status: 'Proses' | 'Success';
  validationStatus: 'Valid' | 'Non Valid' | 'Pending';
  totalAmount: number;
  createdAt: Date;
}

export interface AuthContextType {
  currentAgency: Agency | null;
  currentWorker: Worker | null;
  userType: 'agency' | 'worker' | null;
  login: (agencyName: string, password: string) => Promise<boolean>;
  loginWorker: (workerName: string, password: string) => Promise<boolean>;
  register: (agencyName: string, password: string) => Promise<boolean>;
  registerWorker: (workerName: string, password: string, agencyId: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface Message {
  id: string;
  agencyId: string;
  workerId: string;
  workerName: string;
  agencyName: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}