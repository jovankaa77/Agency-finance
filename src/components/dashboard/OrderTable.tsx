import React, { useState, useMemo } from 'react';
import { Edit, Trash2, Download, Eye, Hash, Search, Filter, X } from 'lucide-react';
import { Order } from '../../types';
import EditOrderModal from './EditOrderModal';
import { generatePDF } from '../../utils/pdfGenerator';

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
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Get unique workers for filter dropdown
  const uniqueWorkers = useMemo(() => {
    const workers = orders
      .filter(order => order.workerName)
      .map(order => order.workerName!)
      .filter((worker, index, array) => array.indexOf(worker) === index)
      .sort();
    return workers;
  }, [orders]);

  // Generate years from 2025 to 2040
  const years = Array.from({ length: 16 }, (_, i) => 2025 + i);
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        order.customerName.toLowerCase().includes(searchLower) ||
        order.orderId.toString().includes(searchLower) ||
        order.orderDate.includes(searchTerm) ||
        order.totalAmount.toString().includes(searchTerm) ||
        order.status.toLowerCase().includes(searchLower) ||
        order.validationStatus.toLowerCase().includes(searchLower) ||
        (order.workerName && order.workerName.toLowerCase().includes(searchLower));

      // Worker filter
      const matchesWorker = !selectedWorker || order.workerName === selectedWorker;

      // Month and year filter
      let matchesDate = true;
      if (selectedMonth || selectedYear) {
        const orderDate = new Date(order.orderDate);
        const orderMonth = (orderDate.getMonth() + 1).toString().padStart(2, '0');
        const orderYear = orderDate.getFullYear().toString();
        
        matchesDate = (!selectedMonth || orderMonth === selectedMonth) &&
                     (!selectedYear || orderYear === selectedYear);
      }

      return matchesSearch && matchesWorker && matchesDate;
    });
  }, [orders, searchTerm, selectedWorker, selectedMonth, selectedYear]);

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      await onOrderDelete(orderId);
    }
  };

  const handleView = (order: Order) => {
    setViewingOrder(order);
  };

  const handleDownloadAllPDF = async () => {
    try {
      const pdf = await generatePDF(filteredOrders, 'All Orders Report', agencyName);
      pdf.save(`${agencyName}_all_orders_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedWorker('');
    setSelectedMonth('');
    setSelectedYear('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Success':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Success</span>;
      case 'Proses':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Proses</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
    }
  };

  const getValidationBadge = (validationStatus: string) => {
    switch (validationStatus) {
      case 'Valid':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Valid</span>;
      case 'Non Valid':
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Non Valid</span>;
      case 'Pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{validationStatus}</span>;
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
        <p className="text-gray-600">Start by adding your first order to track your business.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name, order ID, date, amount, status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Worker Filter */}
          {userType === 'agency' && (
            <div>
              <select
                value={selectedWorker}
                onChange={(e) => setSelectedWorker(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">All Workers</option>
                {uniqueWorkers.map(worker => (
                  <option key={worker} value={worker}>{worker}</option>
                ))}
              </select>
            </div>
          )}

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Months</option>
              {months.map(month => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Years</option>
              {years.map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredOrders.length} of {orders.length} orders
          </div>
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-end">
        <button
          onClick={handleDownloadAllPDF}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF ({filteredOrders.length} orders)
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                Order ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                Order Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                Order Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                Deadline
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                Status
              </th>
              {userType === 'agency' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                  Validation
                </th>
              )}
              {userType === 'agency' && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border-b">
                  Worker
                </th>
              )}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={userType === 'agency' ? 10 : 8} className="px-4 py-8 text-center text-gray-500">
                  No orders found matching your filters
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, index) => (
                <tr key={order.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 text-sm text-gray-900 border-b">
                    #{order.orderId}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-b">
                    {order.customerName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-b">
                    {order.orderType}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-b">
                    {formatDate(order.orderDate)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 border-b">
                    {formatDate(order.deadline)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b">
                    {formatCurrency(order.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    {getStatusBadge(order.status)}
                  </td>
                  {userType === 'agency' && (
                    <td className="px-4 py-3 text-sm border-b">
                      {getValidationBadge(order.validationStatus)}
                    </td>
                  )}
                  {userType === 'agency' && (
                    <td className="px-4 py-3 text-sm text-gray-900 border-b">
                      {order.workerName || '-'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm border-b">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleView(order)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(order)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="Edit Order"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete Order"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingOrder && (
        <EditOrderModal
          order={editingOrder}
          onUpdate={onOrderUpdate}
          onClose={() => setEditingOrder(null)}
          userType={userType}
        />
      )}

      {/* View Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
                <button
                  onClick={() => setViewingOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order ID</label>
                  <div className="flex items-center">
                    <Hash className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-lg font-bold text-blue-600">#{viewingOrder.orderId}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <p className="text-gray-900">{viewingOrder.customerName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                  <p className="text-gray-900">{viewingOrder.orderType}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(viewingOrder.totalAmount)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date</label>
                  <p className="text-gray-900">{formatDate(viewingOrder.orderDate)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <p className="text-gray-900">{formatDate(viewingOrder.deadline)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  {getStatusBadge(viewingOrder.status)}
                </div>
                
                {userType === 'agency' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Validation Status</label>
                    {getValidationBadge(viewingOrder.validationStatus)}
                  </div>
                )}
                
                {userType === 'agency' && viewingOrder.workerName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Worker</label>
                    <p className="text-gray-900">{viewingOrder.workerName}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Down Payments</label>
                <div className="space-y-2">
                  {viewingOrder.downPayments.map((dp, index) => (
                    <div key={dp.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{dp.label}</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(dp.amount || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTable;