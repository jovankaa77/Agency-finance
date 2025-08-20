import React, { useState } from 'react';
import { Edit, Trash2, Eye, FileText, Download, Hash, Search } from 'lucide-react';
import { Order } from '../../types';
import { generatePDF } from '../../utils/pdfGenerator';
import EditOrderModal from './EditOrderModal';

interface OrderTableProps {
  orders: Order[];
  onOrderUpdate: (order: Order) => Promise<void>;
  onOrderDelete: (orderId: string) => Promise<void>;
  agencyName: string;
  userType: 'agency' | 'worker';
}

const OrderTable: React.FC<OrderTableProps> = ({ 
  orders, 
  onOrderUpdate, 
  onOrderDelete, 
  agencyName,
  userType
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterWorker, setFilterWorker] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterValidation, setFilterValidation] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingOrderForForm, setEditingOrderForForm] = useState<Order | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const ordersPerPage = 10;

  // Get unique workers from orders
  const uniqueWorkers = Array.from(new Set(
    orders
      .filter(order => order.workerName)
      .map(order => order.workerName!)
  )).sort();

  // Get unique statuses and validation statuses
  const uniqueStatuses = Array.from(new Set(orders.map(order => order.status))).sort();
  const uniqueValidations = Array.from(new Set(orders.map(order => order.validationStatus))).sort();

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.orderDate.includes(searchTerm) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userType === 'agency' && order.workerName && order.workerName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const orderDate = new Date(order.orderDate);
    const matchesMonth = !filterMonth || orderDate.getMonth() === parseInt(filterMonth);
    const matchesYear = !filterYear || orderDate.getFullYear() === parseInt(filterYear);
    const matchesWorker = !filterWorker || order.workerName === filterWorker || (filterWorker === 'manager' && !order.workerName);
    const matchesStatus = !filterStatus || order.status === filterStatus;
    const matchesValidation = !filterValidation || order.validationStatus === filterValidation;
    
    return matchesSearch && matchesMonth && matchesYear && matchesWorker && matchesStatus && matchesValidation;
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage);

  const handleStatusUpdate = async (orderId: string, newStatus: 'Proses' | 'Success') => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setUpdating(orderId);
      try {
        await onOrderUpdate({ ...order, status: newStatus });
      } finally {
        setUpdating(null);
      }
    }
  };

  const handleValidationUpdate = async (orderId: string, newValidation: 'Valid' | 'Non Valid' | 'Pending') => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setUpdating(orderId);
      try {
        await onOrderUpdate({ ...order, validationStatus: newValidation });
      } finally {
        setUpdating(null);
      }
    }
  };

  const handleDownloadMonthly = async () => {
    const pdf = await generatePDF(filteredOrders, 'Monthly Revenue Report', agencyName);
    pdf.save(`Monthly_Report_${agencyName}.pdf`);
  };

  const handleDownloadAll = async () => {
    const pdf = await generatePDF(orders, 'Complete Revenue Report', agencyName);
    pdf.save(`Complete_Report_${agencyName}.pdf`);
  };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={userType === 'agency' 
                  ? "Search by customer, worker name, order type, date, or status..." 
                  : "Search by customer, order type, date, or status..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Filter Row */}
          <div className="flex flex-wrap gap-4">
            {/* Date Filters */}
            <div className="flex gap-2">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i.toString()}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Years</option>
                {Array.from({ length: 26 }, (_, i) => {
                  const year = 2025 + i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
            
            {/* Worker Filter - Only for Agency */}
            {userType === 'agency' && (
              <select
                value={filterWorker}
                onChange={(e) => setFilterWorker(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
              >
                <option value="">All Workers</option>
                <option value="manager">Manager Only</option>
                {uniqueWorkers.map(worker => (
                  <option key={worker} value={worker}>
                    {worker}
                  </option>
                ))}
              </select>
            )}
            
            {/* Status Filters */}
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Status</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              
              {userType === 'agency' && (
                <select
                  value={filterValidation}
                  onChange={(e) => setFilterValidation(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Validation</option>
                  {uniqueValidations.map(validation => (
                    <option key={validation} value={validation}>
                      {validation}
                    </option>
                  ))}
                </select>
              )}
            </div>
            
            {/* Clear Filters Button */}
            {(searchTerm || filterMonth || filterYear || filterWorker || filterStatus || filterValidation) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterMonth('');
                  setFilterYear('');
                  setFilterWorker('');
                  setFilterStatus('');
                  setFilterValidation('');
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
          
          {/* Action Buttons and Results Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing {filteredOrders.length} of {orders.length} orders
              {filterWorker && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Worker: {filterWorker === 'manager' ? 'Manager Only' : filterWorker}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleDownloadMonthly}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Monthly PDF
              </button>
              <button
                onClick={handleDownloadAll}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                All Data PDF
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              {userType === 'agency' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                DP Breakdown
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bukti Pembayaran
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Validation
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedOrders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 text-blue-600 mr-1" />
                    <span className="text-sm font-bold text-blue-600">
                      {order.orderId}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(order.orderDate).toLocaleDateString()}
                </td>
                {userType === 'agency' && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.workerName || 'Manager'}
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {order.orderType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="space-y-1">
                    {order.downPayments.map((dp, index) => {
                      const amount = dp.amount || 0;
                      return (
                        <div key={dp.id} className="text-xs">
                          <span className="font-medium">{dp.label}:</span> {formatCurrency(amount)}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(order.paymentProof1 || order.paymentProof2 || order.paymentProof3) ? (
                    <div className="flex flex-wrap gap-1">
                      {order.paymentProof1 && (
                        <button
                          onClick={() => {
                            const openFile = (proof: any) => {
                              if (proof.fileType === 'image') {
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${proof.fileName}</title>
                                        <style>
                                          body { 
                                            margin: 0; 
                                            padding: 20px; 
                                            font-family: Arial, sans-serif; 
                                            background: #f5f5f5;
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                          }
                                          .header { 
                                            background: #fff; 
                                            padding: 15px 30px; 
                                            border-radius: 8px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            margin-bottom: 20px;
                                            width: 100%;
                                            max-width: 800px;
                                            box-sizing: border-box;
                                          }
                                          .header h3 { 
                                            margin: 0; 
                                            color: #333; 
                                            text-align: center;
                                          }
                                          .image-container { 
                                            background: #fff;
                                            padding: 20px;
                                            border-radius: 8px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            max-width: 90vw;
                                            max-height: 80vh;
                                            overflow: auto;
                                          }
                                          .image { 
                                            max-width: 100%; 
                                            height: auto;
                                            border-radius: 4px;
                                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                          }
                                          .error { 
                                            padding: 40px; 
                                            text-align: center; 
                                            color: #dc3545;
                                            background: #fff;
                                            border-radius: 8px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                          }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="header">
                                          <h3>🖼️ Bukti Pembayaran 1 - ${proof.fileName}</h3>
                                        </div>
                                        <div class="image-container">
                                          <img src="${proof.url}" alt="${proof.fileName}" class="image" 
                                               onerror="this.parentElement.innerHTML='<div class=\\"error\\"><h4>Gambar tidak dapat ditampilkan</h4><p><a href=\\"${proof.url}\\" target=\\"_blank\\">Klik di sini untuk membuka gambar</a></p></div>'">
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                }
                              } else {
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${proof.fileName}</title>
                                        <style>
                                          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                                          .header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6; }
                                          .header h3 { margin: 0; color: #495057; }
                                          .pdf-container { width: 100%; height: calc(100vh - 60px); }
                                          .pdf-embed { width: 100%; height: 100%; border: none; }
                                          .error { padding: 20px; text-align: center; color: #dc3545; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="header">
                                          <h3>📄 Bukti Pembayaran 1 - ${proof.fileName}</h3>
                                        </div>
                                        <div class="pdf-container">
                                          <embed src="${proof.url}" type="application/pdf" class="pdf-embed">
                                          <div class="error">
                                            <h4>PDF tidak dapat ditampilkan</h4>
                                            <p><a href="${proof.url}" target="_blank">Klik di sini untuk membuka PDF</a></p>
                                          </div>
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                }
                              }
                            };
                            openFile(order.paymentProof1);
                          }}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                        >
                          {order.paymentProof1.fileType === 'image' ? '🖼️' : '📄'} BP 1
                        </button>
                      )}
                      {order.paymentProof2 && (
                        <button
                          onClick={() => {
                            const openFile = (proof: any) => {
                              if (proof.fileType === 'image') {
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${proof.fileName}</title>
                                        <style>
                                          body { 
                                            margin: 0; 
                                            padding: 20px; 
                                            font-family: Arial, sans-serif; 
                                            background: #f5f5f5;
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                          }
                                          .header { 
                                            background: #fff; 
                                            padding: 15px 30px; 
                                            border-radius: 8px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            margin-bottom: 20px;
                                            width: 100%;
                                            max-width: 800px;
                                            box-sizing: border-box;
                                          }
                                          .header h3 { 
                                            margin: 0; 
                                            color: #333; 
                                            text-align: center;
                                          }
                                          .image-container { 
                                            background: #fff;
                                            padding: 20px;
                                            border-radius: 8px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            max-width: 90vw;
                                            max-height: 80vh;
                                            overflow: auto;
                                          }
                                          .image { 
                                            max-width: 100%; 
                                            height: auto;
                                            border-radius: 4px;
                                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                          }
                                          .error { 
                                            padding: 40px; 
                                            text-align: center; 
                                            color: #dc3545;
                                            background: #fff;
                                            border-radius: 8px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                          }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="header">
                                          <h3>🖼️ Bukti Pembayaran 2 - ${proof.fileName}</h3>
                                        </div>
                                        <div class="image-container">
                                          <img src="${proof.url}" alt="${proof.fileName}" class="image" 
                                               onerror="this.parentElement.innerHTML='<div class=\\"error\\"><h4>Gambar tidak dapat ditampilkan</h4><p><a href=\\"${proof.url}\\" target=\\"_blank\\">Klik di sini untuk membuka gambar</a></p></div>'">
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                }
                              } else {
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${proof.fileName}</title>
                                        <style>
                                          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                                          .header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6; }
                                          .header h3 { margin: 0; color: #495057; }
                                          .pdf-container { width: 100%; height: calc(100vh - 60px); }
                                          .pdf-embed { width: 100%; height: 100%; border: none; }
                                          .error { padding: 20px; text-align: center; color: #dc3545; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="header">
                                          <h3>📄 Bukti Pembayaran 2 - ${proof.fileName}</h3>
                                        </div>
                                        <div class="pdf-container">
                                          <embed src="${proof.url}" type="application/pdf" class="pdf-embed">
                                          <div class="error">
                                            <h4>PDF tidak dapat ditampilkan</h4>
                                            <p><a href="${proof.url}" target="_blank">Klik di sini untuk membuka PDF</a></p>
                                          </div>
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                }
                              }
                            };
                            openFile(order.paymentProof2);
                          }}
                          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                        >
                          {order.paymentProof2.fileType === 'image' ? '🖼️' : '📄'} BP 2
                        </button>
                      )}
                      {order.paymentProof3 && (
                        <button
                          onClick={() => {
                            const openFile = (proof: any) => {
                              if (proof.fileType === 'image') {
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${proof.fileName}</title>
                                        <style>
                                          body { 
                                            margin: 0; 
                                            padding: 20px; 
                                            font-family: Arial, sans-serif; 
                                            background: #f5f5f5;
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                          }
                                          .header { 
                                            background: #fff; 
                                            padding: 15px 30px; 
                                            border-radius: 8px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            margin-bottom: 20px;
                                            width: 100%;
                                            max-width: 800px;
                                            box-sizing: border-box;
                                          }
                                          .header h3 { 
                                            margin: 0; 
                                            color: #333; 
                                            text-align: center;
                                          }
                                          .image-container { 
                                            background: #fff;
                                            padding: 20px;
                                            border-radius: 8px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            max-width: 90vw;
                                            max-height: 80vh;
                                            overflow: auto;
                                          }
                                          .image { 
                                            max-width: 100%; 
                                            height: auto;
                                            border-radius: 4px;
                                            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                          }
                                          .error { 
                                            padding: 40px; 
                                            text-align: center; 
                                            color: #dc3545;
                                            background: #fff;
                                            border-radius: 8px;
                                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                          }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="header">
                                          <h3>🖼️ Bukti Pembayaran 3 - ${proof.fileName}</h3>
                                        </div>
                                        <div class="image-container">
                                          <img src="${proof.url}" alt="${proof.fileName}" class="image" 
                                               onerror="this.parentElement.innerHTML='<div class=\\"error\\"><h4>Gambar tidak dapat ditampilkan</h4><p><a href=\\"${proof.url}\\" target=\\"_blank\\">Klik di sini untuk membuka gambar</a></p></div>'">
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                }
                              } else {
                                const newWindow = window.open();
                                if (newWindow) {
                                  newWindow.document.write(`
                                    <html>
                                      <head>
                                        <title>${proof.fileName}</title>
                                        <style>
                                          body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                                          .header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6; }
                                          .header h3 { margin: 0; color: #495057; }
                                          .pdf-container { width: 100%; height: calc(100vh - 60px); }
                                          .pdf-embed { width: 100%; height: 100%; border: none; }
                                          .error { padding: 20px; text-align: center; color: #dc3545; }
                                        </style>
                                      </head>
                                      <body>
                                        <div class="header">
                                          <h3>📄 Bukti Pembayaran 3 - ${proof.fileName}</h3>
                                        </div>
                                        <div class="pdf-container">
                                          <embed src="${proof.url}" type="application/pdf" class="pdf-embed">
                                          <div class="error">
                                            <h4>PDF tidak dapat ditampilkan</h4>
                                            <p><a href="${proof.url}" target="_blank">Klik di sini untuk membuka PDF</a></p>
                                          </div>
                                        </div>
                                      </body>
                                    </html>
                                  `);
                                }
                              }
                            };
                            openFile(order.paymentProof3);
                          }}
                          className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                        >
                          {order.paymentProof3.fileType === 'image' ? '🖼️' : '📄'} BP 3
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No files</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(order.totalAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value as 'Proses' | 'Success')}
                    disabled={updating === order.id}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${
                      order.status === 'Success'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    } ${updating === order.id ? 'opacity-50' : ''}`}
                  >
                    <option value="Proses">Proses</option>
                    <option value="Success">Success</option>
                  </select>
                </td>
                {userType === 'agency' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.validationStatus}
                      onChange={(e) => handleValidationUpdate(order.id, e.target.value as 'Valid' | 'Non Valid' | 'Pending')}
                      disabled={updating === order.id}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${
                        order.validationStatus === 'Valid'
                          ? 'bg-green-100 text-green-800'
                          : order.validationStatus === 'Non Valid'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      } ${updating === order.id ? 'opacity-50' : ''}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Valid">Valid</option>
                      <option value="Non Valid">Non Valid</option>
                    </select>
                  </td>
                )}
                {userType === 'worker' && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      order.validationStatus === 'Valid'
                        ? 'bg-green-100 text-green-800'
                        : order.validationStatus === 'Non Valid'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.validationStatus}
                    </span>
                  </td>
                )}
                
                {/* Actions Column */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingOrderForForm(order)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Edit Order"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingOrder(order)}
                      className="text-green-600 hover:text-green-900"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onOrderDelete(order.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete Order"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 py-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 border rounded-lg ${
                currentPage === page
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Order Detail Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Order Details</h3>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Date</label>
                  <p className="text-sm text-gray-900">{new Date(editingOrder.orderDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Deadline</label>
                  <p className="text-sm text-gray-900">{new Date(editingOrder.deadline).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer</label>
                  <p className="text-sm text-gray-900">{editingOrder.customerName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Type</label>
                  <p className="text-sm text-gray-900">{editingOrder.orderType}</p>
                </div>
              </div>
              
              {editingOrder.workerName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Worker</label>
                  <p className="text-sm text-gray-900">{editingOrder.workerName}</p>
                </div>
              )}
              
              {(editingOrder.paymentProof1 || editingOrder.paymentProof2 || editingOrder.paymentProof3) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bukti Pembayaran
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {editingOrder.paymentProof1 && (
                      <div className="bg-gray-50 rounded-lg border p-3">
                        <div className="flex flex-col items-center space-y-2">
                          <button
                            onClick={() => {
                              const openFile = (proof: any) => {
                                if (proof.fileType === 'image') {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>${proof.fileName}</title>
                                          <style>
                                            body { 
                                              margin: 0; 
                                              padding: 20px; 
                                              font-family: Arial, sans-serif; 
                                              background: #f5f5f5;
                                              display: flex;
                                              flex-direction: column;
                                              align-items: center;
                                            }
                                            .header { 
                                              background: #fff; 
                                              padding: 15px 30px; 
                                              border-radius: 8px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                              margin-bottom: 20px;
                                              width: 100%;
                                              max-width: 800px;
                                              box-sizing: border-box;
                                            }
                                            .header h3 { 
                                              margin: 0; 
                                              color: #333; 
                                              text-align: center;
                                            }
                                            .image-container { 
                                              background: #fff;
                                              padding: 20px;
                                              border-radius: 8px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                              max-width: 90vw;
                                              max-height: 80vh;
                                              overflow: auto;
                                            }
                                            .image { 
                                              max-width: 100%; 
                                              height: auto;
                                              border-radius: 4px;
                                              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                            }
                                            .error { 
                                              padding: 40px; 
                                              text-align: center; 
                                              color: #dc3545;
                                              background: #fff;
                                              border-radius: 8px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            }
                                          </style>
                                        </head>
                                        <body>
                                          <div class="header">
                                            <h3>🖼️ Bukti Pembayaran 1 - ${proof.fileName}</h3>
                                          </div>
                                          <div class="image-container">
                                            <img src="${proof.url}" alt="${proof.fileName}" class="image" 
                                                 onerror="this.parentElement.innerHTML='<div class=\\"error\\"><h4>Gambar tidak dapat ditampilkan</h4><p><a href=\\"${proof.url}\\" target=\\"_blank\\">Klik di sini untuk membuka gambar</a></p></div>'">
                                          </div>
                                        </body>
                                      </html>
                                    `);
                                  }
                                } else {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>${proof.fileName}</title>
                                          <style>
                                            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                                            .header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6; }
                                            .header h3 { margin: 0; color: #495057; }
                                            .pdf-container { width: 100%; height: calc(100vh - 60px); }
                                            .pdf-embed { width: 100%; height: 100%; border: none; }
                                            .error { padding: 20px; text-align: center; color: #dc3545; }
                                          </style>
                                        </head>
                                        <body>
                                          <div class="header">
                                            <h3>📄 Bukti Pembayaran 1 - ${proof.fileName}</h3>
                                          </div>
                                          <div class="pdf-container">
                                            <embed src="${proof.url}" type="application/pdf" class="pdf-embed">
                                            <div class="error">
                                              <h4>PDF tidak dapat ditampilkan</h4>
                                              <p><a href="${proof.url}" target="_blank">Klik di sini untuk membuka PDF</a></p>
                                            </div>
                                          </div>
                                        </body>
                                      </html>
                                    `);
                                  }
                                }
                              };
                              openFile(editingOrder.paymentProof1);
                            }}
                            className={`w-full h-32 rounded border flex items-center justify-center hover:opacity-80 transition-all cursor-pointer ${
                              editingOrder.paymentProof1.fileType === 'image' 
                                ? 'bg-blue-50 border-blue-200' 
                                : 'bg-blue-100 border-blue-300'
                            }`}
                          >
                            {editingOrder.paymentProof1.fileType === 'image' ? (
                              <img 
                                src={editingOrder.paymentProof1.url} 
                                alt={editingOrder.paymentProof1.fileName}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="text-center">
                                        <div class="text-red-600 text-2xl font-bold mb-1">⚠️</div>
                                        <div class="text-red-600 text-xs font-medium">Error</div>
                                        <div class="text-red-600 text-xs">Klik untuk coba lagi</div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="text-center">
                                <div className="text-blue-600 text-2xl font-bold mb-1">📄</div>
                                <div className="text-blue-600 text-xs font-medium">BP 1</div>
                                <div className="text-blue-600 text-xs">Klik untuk lihat</div>
                              </div>
                            )}
                          </button>
                          <div className="text-center w-full">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              Bukti Pembayaran 1
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {editingOrder.paymentProof1.fileName}
                            </p>
                            <p className="text-xs text-blue-600">
                              {editingOrder.paymentProof1.fileType === 'image' ? 'Gambar' : 'PDF'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {editingOrder.paymentProof2 && (
                      <div className="bg-gray-50 rounded-lg border p-3">
                        <div className="flex flex-col items-center space-y-2">
                          <button
                            onClick={() => {
                              const openFile = (proof: any) => {
                                if (proof.fileType === 'image') {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>${proof.fileName}</title>
                                          <style>
                                            body { 
                                              margin: 0; 
                                              padding: 20px; 
                                              font-family: Arial, sans-serif; 
                                              background: #f5f5f5;
                                              display: flex;
                                              flex-direction: column;
                                              align-items: center;
                                            }
                                            .header { 
                                              background: #fff; 
                                              padding: 15px 30px; 
                                              border-radius: 8px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                              margin-bottom: 20px;
                                              width: 100%;
                                              max-width: 800px;
                                              box-sizing: border-box;
                                            }
                                            .header h3 { 
                                              margin: 0; 
                                              color: #333; 
                                              text-align: center;
                                            }
                                            .image-container { 
                                              background: #fff;
                                              padding: 20px;
                                              border-radius: 8px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                              max-width: 90vw;
                                              max-height: 80vh;
                                              overflow: auto;
                                            }
                                            .image { 
                                              max-width: 100%; 
                                              height: auto;
                                              border-radius: 4px;
                                              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                            }
                                            .error { 
                                              padding: 40px; 
                                              text-align: center; 
                                              color: #dc3545;
                                              background: #fff;
                                              border-radius: 8px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            }
                                          </style>
                                        </head>
                                        <body>
                                          <div class="header">
                                            <h3>🖼️ Bukti Pembayaran 2 - ${proof.fileName}</h3>
                                          </div>
                                          <div class="image-container">
                                            <img src="${proof.url}" alt="${proof.fileName}" class="image" 
                                                 onerror="this.parentElement.innerHTML='<div class=\\"error\\"><h4>Gambar tidak dapat ditampilkan</h4><p><a href=\\"${proof.url}\\" target=\\"_blank\\">Klik di sini untuk membuka gambar</a></p></div>'">
                                          </div>
                                        </body>
                                      </html>
                                    `);
                                  }
                                } else {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>${proof.fileName}</title>
                                          <style>
                                            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                                            .header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6; }
                                            .header h3 { margin: 0; color: #495057; }
                                            .pdf-container { width: 100%; height: calc(100vh - 60px); }
                                            .pdf-embed { width: 100%; height: 100%; border: none; }
                                            .error { padding: 20px; text-align: center; color: #dc3545; }
                                          </style>
                                        </head>
                                        <body>
                                          <div class="header">
                                            <h3>📄 Bukti Pembayaran 2 - ${proof.fileName}</h3>
                                          </div>
                                          <div class="pdf-container">
                                            <embed src="${proof.url}" type="application/pdf" class="pdf-embed">
                                            <div class="error">
                                              <h4>PDF tidak dapat ditampilkan</h4>
                                              <p><a href="${proof.url}" target="_blank">Klik di sini untuk membuka PDF</a></p>
                                            </div>
                                          </div>
                                        </body>
                                      </html>
                                    `);
                                  }
                                }
                              };
                              openFile(editingOrder.paymentProof2);
                            }}
                            className={`w-full h-32 rounded border flex items-center justify-center hover:opacity-80 transition-all cursor-pointer ${
                              editingOrder.paymentProof2.fileType === 'image' 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-green-100 border-green-300'
                            }`}
                          >
                            {editingOrder.paymentProof2.fileType === 'image' ? (
                              <img 
                                src={editingOrder.paymentProof2.url} 
                                alt={editingOrder.paymentProof2.fileName}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="text-center">
                                        <div class="text-red-600 text-2xl font-bold mb-1">⚠️</div>
                                        <div class="text-red-600 text-xs font-medium">Error</div>
                                        <div class="text-red-600 text-xs">Klik untuk coba lagi</div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="text-center">
                                <div className="text-green-600 text-2xl font-bold mb-1">📄</div>
                                <div className="text-green-600 text-xs font-medium">BP 2</div>
                                <div className="text-green-600 text-xs">Klik untuk lihat</div>
                              </div>
                            )}
                          </button>
                          <div className="text-center w-full">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              Bukti Pembayaran 2
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {editingOrder.paymentProof2.fileName}
                            </p>
                            <p className="text-xs text-green-600">
                              {editingOrder.paymentProof2.fileType === 'image' ? 'Gambar' : 'PDF'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {editingOrder.paymentProof3 && (
                      <div className="bg-gray-50 rounded-lg border p-3">
                        <div className="flex flex-col items-center space-y-2">
                          <button
                            onClick={() => {
                              const openFile = (proof: any) => {
                                if (proof.fileType === 'image') {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>${proof.fileName}</title>
                                          <style>
                                            body { 
                                              margin: 0; 
                                              padding: 20px; 
                                              font-family: Arial, sans-serif; 
                                              background: #f5f5f5;
                                              display: flex;
                                              flex-direction: column;
                                              align-items: center;
                                            }
                                            .header { 
                                              background: #fff; 
                                              padding: 15px 30px; 
                                              border-radius: 8px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                              margin-bottom: 20px;
                                              width: 100%;
                                              max-width: 800px;
                                              box-sizing: border-box;
                                            }
                                            .header h3 { 
                                              margin: 0; 
                                              color: #333; 
                                              text-align: center;
                                            }
                                            .image-container { 
                                              background: #fff;
                                              padding: 20px;
                                              border-radius: 8px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                              max-width: 90vw;
                                              max-height: 80vh;
                                              overflow: auto;
                                            }
                                            .image { 
                                              max-width: 100%; 
                                              height: auto;
                                              border-radius: 4px;
                                              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                                            }
                                            .error { 
                                              padding: 40px; 
                                              text-align: center; 
                                              color: #dc3545;
                                              background: #fff;
                                              border-radius: 8px;
                                              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                                            }
                                          </style>
                                        </head>
                                        <body>
                                          <div class="header">
                                            <h3>🖼️ Bukti Pembayaran 3 - ${proof.fileName}</h3>
                                          </div>
                                          <div class="image-container">
                                            <img src="${proof.url}" alt="${proof.fileName}" class="image" 
                                                 onerror="this.parentElement.innerHTML='<div class=\\"error\\"><h4>Gambar tidak dapat ditampilkan</h4><p><a href=\\"${proof.url}\\" target=\\"_blank\\">Klik di sini untuk membuka gambar</a></p></div>'">
                                          </div>
                                        </body>
                                      </html>
                                    `);
                                  }
                                } else {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`
                                      <html>
                                        <head>
                                          <title>${proof.fileName}</title>
                                          <style>
                                            body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                                            .header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6; }
                                            .header h3 { margin: 0; color: #495057; }
                                            .pdf-container { width: 100%; height: calc(100vh - 60px); }
                                            .pdf-embed { width: 100%; height: 100%; border: none; }
                                            .error { padding: 20px; text-align: center; color: #dc3545; }
                                          </style>
                                        </head>
                                        <body>
                                          <div class="header">
                                            <h3>📄 Bukti Pembayaran 3 - ${proof.fileName}</h3>
                                          </div>
                                          <div class="pdf-container">
                                            <embed src="${proof.url}" type="application/pdf" class="pdf-embed">
                                            <div class="error">
                                              <h4>PDF tidak dapat ditampilkan</h4>
                                              <p><a href="${proof.url}" target="_blank">Klik di sini untuk membuka PDF</a></p>
                                            </div>
                                          </div>
                                        </body>
                                      </html>
                                    `);
                                  }
                                }
                              };
                              openFile(editingOrder.paymentProof3);
                            }}
                            className={`w-full h-32 rounded border flex items-center justify-center hover:opacity-80 transition-all cursor-pointer ${
                              editingOrder.paymentProof3.fileType === 'image' 
                                ? 'bg-purple-50 border-purple-200' 
                                : 'bg-purple-100 border-purple-300'
                            }`}
                          >
                            {editingOrder.paymentProof3.fileType === 'image' ? (
                              <img 
                                src={editingOrder.paymentProof3.url} 
                                alt={editingOrder.paymentProof3.fileName}
                                className="w-full h-full object-cover rounded"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `
                                      <div class="text-center">
                                        <div class="text-red-600 text-2xl font-bold mb-1">⚠️</div>
                                        <div class="text-red-600 text-xs font-medium">Error</div>
                                        <div class="text-red-600 text-xs">Klik untuk coba lagi</div>
                                      </div>
                                    `;
                                  }
                                }}
                              />
                            ) : (
                              <div className="text-center">
                                <div className="text-purple-600 text-2xl font-bold mb-1">📄</div>
                                <div className="text-purple-600 text-xs font-medium">BP 3</div>
                                <div className="text-purple-600 text-xs">Klik untuk lihat</div>
                              </div>
                            )}
                          </button>
                          <div className="text-center w-full">
                            <p className="text-xs font-medium text-gray-700 truncate">
                              Bukti Pembayaran 3
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {editingOrder.paymentProof3.fileName}
                            </p>
                            <p className="text-xs text-purple-600">
                              {editingOrder.paymentProof3.fileType === 'image' ? 'Gambar' : 'PDF'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(editingOrder.totalAmount)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  editingOrder.status === 'Success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {editingOrder.status}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Validation Status</label>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                  editingOrder.validationStatus === 'Valid'
                    ? 'bg-green-100 text-green-800'
                    : editingOrder.validationStatus === 'Non Valid'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {editingOrder.validationStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editingOrderForForm && (
        <EditOrderModal
          order={editingOrderForForm}
          onUpdate={onOrderUpdate}
          onClose={() => setEditingOrderForForm(null)}
          userType={userType}
        />
      )}
    </div>
  );
};

export default OrderTable;