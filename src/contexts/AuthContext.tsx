import React, { createContext, useContext, useState, useEffect } from 'react';
import { Agency, Worker, AuthContextType } from '../types';
import { firebaseStorage } from '../utils/firebaseStorage';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [userType, setUserType] = useState<'agency' | 'worker' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedAgency = localStorage.getItem('currentAgency');
    const savedWorker = localStorage.getItem('currentWorker');
    const savedUserType = localStorage.getItem('userType');
    
    if (savedAgency) {
      const agency = JSON.parse(savedAgency);
      setCurrentAgency(agency);
      setIsAuthenticated(true);
      setUserType('agency');
    } else if (savedWorker) {
      const worker = JSON.parse(savedWorker);
      setCurrentWorker(worker);
      setIsAuthenticated(true);
      setUserType('worker');
    }
    
    if (savedUserType) {
      setUserType(savedUserType as 'agency' | 'worker');
    }
    
    setLoading(false);
  }, []);

  const login = async (agencyName: string, password: string): Promise<boolean> => {
    try {
      const agency = await firebaseStorage.findAgency(agencyName, password);
      if (agency) {
        setCurrentAgency(agency);
        setCurrentWorker(null);
        setUserType('agency');
        setIsAuthenticated(true);
        localStorage.setItem('currentAgency', JSON.stringify(agency));
        localStorage.setItem('userType', 'agency');
        localStorage.removeItem('currentWorker');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWorker = async (workerName: string, password: string): Promise<boolean> => {
    try {
      const worker = await firebaseStorage.findWorker(workerName, password);
      if (worker) {
        setCurrentWorker(worker);
        setCurrentAgency(null);
        setUserType('worker');
        setIsAuthenticated(true);
        localStorage.setItem('currentWorker', JSON.stringify(worker));
        localStorage.setItem('userType', 'worker');
        localStorage.removeItem('currentAgency');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Worker login error:', error);
      return false;
    }
  };

  const register = async (agencyName: string, password: string): Promise<boolean> => {
    try {
      const exists = await firebaseStorage.agencyExists(agencyName);
      if (exists) {
        return false;
      }
      
      const newAgency = {
        name: agencyName,
        password,
        createdAt: new Date()
      };
      
      const agencyId = await firebaseStorage.saveAgency(newAgency);
      return agencyId !== null;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };


  const logout = () => {
    setCurrentAgency(null);
    setCurrentWorker(null);
    setUserType(null);
    setIsAuthenticated(false);
    localStorage.removeItem('currentAgency');
    localStorage.removeItem('currentWorker');
    localStorage.removeItem('userType');
  };

  return (
    <AuthContext.Provider value={{
      currentAgency,
      currentWorker,
      userType,
      login,
      loginWorker,
      register,
      logout,
      isAuthenticated,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};