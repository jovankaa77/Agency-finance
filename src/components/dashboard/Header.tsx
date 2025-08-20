import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Building2 } from 'lucide-react';

const Header: React.FC = () => {
  const { currentAgency, currentWorker, userType, logout } = useAuth();
  
  const currentUser = currentAgency || currentWorker;
  const isAgency = userType === 'agency';

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Finance Dashboard</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
              <p className="text-xs text-gray-500">
                {isAgency ? `Agency Account • ID: ${currentAgency?.id}` : 'Worker Account'}
              </p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;