import React, { useState } from "react";
import { X, Plus, Minus, Hash } from "lucide-react";
import { Order, DownPayment } from "../../types";
import { calculateOrderTotal } from "../../utils/calculations";
import { firebaseStorage } from "../../utils/firebaseStorage";

interface OrderFormProps {
  onSubmit: (order: Omit<Order, "id">) => void;
  onClose: () => void;
  agencyId: string;
  workerId?: string;
  workerName?: string;
  userType: "agency" | "worker";
}

const OrderForm: React.FC<OrderFormProps> = ({
  onSubmit,
  onClose,
  agencyId,
  workerId,
  workerName,
  userType,
}) => {
  const [formData, setFormData] = useState({
    orderDate: "",
    deadline: "",
    customerName: "",
    orderType: "",
    status: "Proses" as const,
    validationStatus: "Pending" as const,
  });

  const [downPayments, setDownPayments] = useState<DownPayment[]>([
    { id: "1", amount: 0, label: "DP 1" },
  ]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addDownPayment = () => {
    const newDP: DownPayment = {
      id: Date.now().toString(),
      amount: 0,
      label: `DP ${downPayments.length + 1}`,
    };
    setDownPayments([...downPayments, newDP]);
  };

  const removeDownPayment = (id: string) => {
    if (downPayments.length > 1) {
      setDownPayments(downPayments.filter((dp) => dp.id !== id));
    }
  };

  const updateDownPayment = (
    id: string,
    field: "percentage" | "amount",
    value: number
  ) => {
    setDownPayments((prev) =>
      prev.map((dp) => {
        if (dp.id === id) {
          return { ...dp, amount: value };
        }
        return dp;
      })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.orderDate ||
      !formData.deadline ||
      !formData.customerName ||
      !formData.orderType
    ) {
      alert("Please fill in all required fields");
      return;
    }

    // Get next order ID
    const orderId = await firebaseStorage.getNextOrderId(agencyId);

    const baseOrder = {
      agencyId,
      orderId,
      ...formData,
      downPayments,
      totalAmount: 0,
      createdAt: new Date(),
    };

    // Conditionally add worker fields only if userType is 'worker'
    const newOrder =
      userType === "worker"
        ? { ...baseOrder, workerId, workerName }
        : { ...baseOrder, workerName: "by agency" };

    newOrder.totalAmount = calculateOrderTotal(newOrder);
    onSubmit(newOrder);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Add New Order {userType === "worker" && `(${workerName})`}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date *
              </label>
              <input
                type="date"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline *
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Logo Design, Video Editing, Website"
              required
            />
          </div>

          {/* Down Payments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Down Payments
              </label>
              <button
                type="button"
                onClick={addDownPayment}
                className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add DP
              </button>
            </div>

            {downPayments.map((dp, index) => (
              <div
                key={dp.id}
                className="flex items-center gap-4 mb-3 p-4 bg-gray-50 rounded-lg"
              >
                <span className="text-sm font-medium text-gray-700 min-w-[40px]">
                  {dp.label}
                </span>

                <div className="flex-1">
                  <input
                    type="number"
                    placeholder="Amount (Rp)"
                    value={dp.amount || ""}
                    onChange={(e) =>
                      updateDownPayment(
                        dp.id,
                        "amount",
                        parseInt(e.target.value) || 0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>

                {downPayments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDownPayment(dp.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Proses">Proses</option>
              <option value="Success">Success</option>
            </select>
          </div>

          {userType === "agency" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Validation Status
              </label>
              <select
                name="validationStatus"
                value={formData.validationStatus}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Pending">Pending</option>
                <option value="Valid">Valid</option>
                <option value="Non Valid">Non Valid</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md"
            >
              Add Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
