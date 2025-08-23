import React, { useState } from "react";
import { Plus, Edit, Trash2, Download, Search, Filter, X } from "lucide-react";
import { Expense } from "../../types";
import { generatePDF } from "../../utils/pdfGenerator";

interface ExpenseAnalysisProps {
  expenses: Expense[];
  onExpenseSubmit: (expense: Omit<Expense, "id">) => Promise<void>;
  onExpenseUpdate: (expense: Expense) => Promise<void>;
  onExpenseDelete: (expenseId: string) => Promise<void>;
  agencyId: string;
  agencyName: string;
}

const ExpenseAnalysis: React.FC<ExpenseAnalysisProps> = ({
  expenses,
  onExpenseSubmit,
  onExpenseUpdate,
  onExpenseDelete,
  agencyId,
  agencyName,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [formData, setFormData] = useState({
    orderId: "",
    customerName: "",
    orderType: "",
    date: "",
    amount: 0,
    status: "Proses" as const,
  });

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      expense.orderId.toLowerCase().includes(searchLower) ||
      expense.customerName.toLowerCase().includes(searchLower) ||
      expense.orderType.toLowerCase().includes(searchLower) ||
      expense.date.includes(searchTerm) ||
      expense.amount.toString().includes(searchTerm) ||
      expense.status.toLowerCase().includes(searchLower);

    let matchesDate = true;
    if (selectedMonth || selectedYear) {
      const expenseDate = new Date(expense.date);
      const expenseMonth = (expenseDate.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const expenseYear = expenseDate.getFullYear().toString();

      matchesDate =
        (!selectedMonth || expenseMonth === selectedMonth) &&
        (!selectedYear || expenseYear === selectedYear);
    }

    return matchesSearch && matchesDate;
  });

  const totalExpenses = filteredExpenses
    .filter((expense) => expense.status === "Success")
    .reduce((sum, expense) => sum + expense.amount, 0);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.orderId ||
      !formData.customerName ||
      !formData.orderType ||
      !formData.date
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const expense = {
      ...formData,
      agencyId,
      createdAt: new Date(),
    };

    if (editingExpense) {
      await onExpenseUpdate({ ...expense, id: editingExpense.id });
      setEditingExpense(null);
    } else {
      await onExpenseSubmit(expense);
    }

    setFormData({
      orderId: "",
      customerName: "",
      orderType: "",
      date: "",
      amount: 0,
      status: "Proses",
    });
    setIsFormOpen(false);
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      orderId: expense.orderId,
      customerName: expense.customerName,
      orderType: expense.orderType,
      date: expense.date,
      amount: expense.amount,
      status: expense.status,
    });
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = async (expenseId: string) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await onExpenseDelete(expenseId);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdf = await generatePDF(
        filteredExpenses.map((expense) => ({
          id: expense.id,
          orderId: parseInt(expense.orderId),
          agencyId: expense.agencyId,
          orderDate: expense.date,
          deadline: expense.date,
          customerName: expense.customerName,
          orderType: expense.orderType,
          downPayments: [{ id: "1", amount: expense.amount, label: "Expense" }],
          baseAmount: expense.amount,
          status: expense.status,
          validationStatus: "Valid" as const,
          totalAmount: expense.amount,
          createdAt: expense.createdAt,
        })),
        "Expense Report",
        agencyName
      );
      pdf.save(
        `${agencyName}_expenses_${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedMonth("");
    setSelectedYear("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Success":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
            Success
          </span>
        );
      case "Proses":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
            Proses
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID");
  };

  const years = Array.from({ length: 16 }, (_, i) => 2025 + i);
  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Expense Analysis
            </h2>
            <p className="text-gray-600 mt-1">
              Track and manage agency expenses
            </p>
            <p className="text-sm font-medium text-green-600 mt-2">
              Total Expenses (Success): {formatCurrency(totalExpenses)}
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Expense
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="p-6 border-b border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="">All Months</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </button>
            <button
              onClick={handleDownloadPDF}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredExpenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No expenses found
                </td>
              </tr>
            ) : (
              filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.orderId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.customerName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {expense.orderType}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(expense.date)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(expense.status)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                        title="Edit Expense"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete Expense"
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

      {/* Expense Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingExpense ? "Edit Expense" : "Add New Expense"}
                </h3>
                <button
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingExpense(null);
                    setFormData({
                      orderId: "",
                      customerName: "",
                      orderType: "",
                      date: "",
                      amount: 0,
                      status: "Proses",
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order ID *
                </label>
                <input
                  type="text"
                  name="orderId"
                  value={formData.orderId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter order ID"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Type *
                </label>
                <input
                  type="text"
                  name="orderType"
                  value={formData.orderType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter order type"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter amount"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="Proses">Proses</option>
                  <option value="Success">Success</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingExpense(null);
                    setFormData({
                      orderId: "",
                      customerName: "",
                      orderType: "",
                      date: "",
                      amount: 0,
                      status: "Proses",
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
                >
                  {editingExpense ? "Update" : "Add"} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseAnalysis;
