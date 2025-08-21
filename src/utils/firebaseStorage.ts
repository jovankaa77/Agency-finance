import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { Agency, Order, Worker, Message } from '../types';

export const firebaseStorage = {
  // Agency management
  async getAgencies(): Promise<Agency[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'agencies'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Agency[];
    } catch (error) {
      console.error('Error getting agencies:', error);
      return [];
    }
  },

  async saveAgency(agency: Omit<Agency, 'id'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, 'agencies'), {
        ...agency,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving agency:', error);
      return null;
    }
  },

  async findAgency(name: string, password: string): Promise<Agency | null> {
    try {
      const q = query(
        collection(db, 'agencies'), 
        where('name', '==', name),
        where('password', '==', password)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Agency;
      }
      return null;
    } catch (error) {
      console.error('Error finding agency:', error);
      return null;
    }
  },

  async agencyExists(name: string): Promise<boolean> {
    try {
      const q = query(collection(db, 'agencies'), where('name', '==', name));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking agency existence:', error);
      return false;
    }
  },

  // Worker management
  async getWorkers(agencyId: string): Promise<Worker[]> {
    try {
      const q = query(
        collection(db, 'workers'), 
        where('agencyId', '==', agencyId)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Worker[];
    } catch (error) {
      console.error('Error getting workers:', error);
      return [];
    }
  },

  async saveWorker(worker: Omit<Worker, 'id'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, 'workers'), {
        ...worker,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving worker:', error);
      return null;
    }
  },

  async findWorker(name: string, password: string): Promise<Worker | null> {
    try {
      const q = query(
        collection(db, 'workers'), 
        where('name', '==', name),
        where('password', '==', password)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return {
          id: doc.id,
          ...doc.data()
        } as Worker;
      }
      return null;
    } catch (error) {
      console.error('Error finding worker:', error);
      return null;
    }
  },

  async workerExists(name: string, agencyId: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'workers'), 
        where('name', '==', name),
        where('agencyId', '==', agencyId)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking worker existence:', error);
      return false;
    }
  },

  // Order management
  async getOrders(agencyId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'), 
        where('agencyId', '==', agencyId)
      );
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      // Sort by createdAt in JavaScript instead of Firestore
      return orders.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error getting orders:', error);
      return [];
    }
  },

  async getNextOrderId(agencyId: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'orders'), 
        where('agencyId', '==', agencyId)
      );
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => doc.data()) as Order[];
      
      if (orders.length === 0) {
        return 100; // Start from 100
      }
      
      const maxOrderId = Math.max(...orders.map(order => order.orderId || 99));
      return maxOrderId + 1;
    } catch (error) {
      console.error('Error getting next order ID:', error);
      return 100;
    }
  },

  async saveOrder(order: Omit<Order, 'id'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...order,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving order:', error);
      return null;
    }
  },

  async updateOrder(orderId: string, updatedOrder: Partial<Order>): Promise<boolean> {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, updatedOrder);
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      return false;
    }
  },

  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      return false;
    }
  },

  async getOrdersByWorker(workerId: string): Promise<Order[]> {
    try {
      const q = query(
        collection(db, 'orders'), 
        where('workerId', '==', workerId)
      );
      const querySnapshot = await getDocs(q);
      const orders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      return orders.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error getting worker orders:', error);
      return [];
    }
  },

  // Expense management
  async getExpenses(agencyId: string): Promise<any[]> {
    try {
      const q = query(
        collection(db, 'expenses'), 
        where('agencyId', '==', agencyId)
      );
      const querySnapshot = await getDocs(q);
      const expenses = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      return expenses.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
    } catch (error) {
      console.error('Error getting expenses:', error);
      return [];
    }
  },

  async saveExpense(expense: any): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, 'expenses'), {
        ...expense,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving expense:', error);
      return null;
    }
  },

  async updateExpense(expenseId: string, updatedExpense: any): Promise<boolean> {
    try {
      const expenseRef = doc(db, 'expenses', expenseId);
      await updateDoc(expenseRef, updatedExpense);
      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      return false;
    }
  },

  async deleteExpense(expenseId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  },

  // File upload to Firebase Storage
  async uploadFile(file: File, path: string): Promise<string | null> {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  },

  // Message management
  async getMessages(workerId: string): Promise<Message[]> {
    try {
      const q = query(
        collection(db, 'messages'), 
        where('workerId', '==', workerId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  },

  async sendMessage(message: Omit<Message, 'id'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        ...message,
        createdAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { isRead: true });
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  },

  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }
};