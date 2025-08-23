import React from "react";
import {
  TrendingUp,
  Calendar,
  DollarSign,
  TrendingDown,
  PiggyBank,
} from "lucide-react";

interface RevenueCardsProps {
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  weeklyExpenses?: number;
  monthlyExpenses?: number;
  yearlyExpenses?: number;
  weeklyProfit?: number;
  monthlyProfit?: number;
  yearlyProfit?: number;
  isAgency: boolean;
}

const RevenueCards: React.FC<RevenueCardsProps> = ({
  weeklyRevenue,
  monthlyRevenue,
  yearlyRevenue,
  weeklyExpenses = 0,
  monthlyExpenses = 0,
  yearlyExpenses = 0,
  weeklyProfit = 0,
  monthlyProfit = 0,
  yearlyProfit = 0,
  isAgency,
}) => {
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  const revenueCards = [
    {
      title: "Weekly Revenue",
      value: weeklyRevenue,
      icon: Calendar,
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Monthly Revenue",
      value: monthlyRevenue,
      icon: TrendingUp,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Yearly Revenue",
      value: yearlyRevenue,
      icon: DollarSign,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const agencyCards = [
    {
      title: "Weekly Revenue",
      value: weeklyRevenue,
      icon: Calendar,
      color: "from-emerald-500 to-green-600",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Weekly Expenses",
      value: weeklyExpenses,
      icon: TrendingDown,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Weekly Profit",
      value: weeklyProfit,
      icon: PiggyBank,
      color:
        weeklyProfit >= 0
          ? "from-green-500 to-green-600"
          : "from-red-500 to-red-600",
      bgColor: weeklyProfit >= 0 ? "bg-green-50" : "bg-red-50",
      iconColor: weeklyProfit >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Monthly Revenue",
      value: monthlyRevenue,
      icon: TrendingUp,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Monthly Expenses",
      value: monthlyExpenses,
      icon: TrendingDown,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Monthly Profit",
      value: monthlyProfit,
      icon: PiggyBank,
      color:
        monthlyProfit >= 0
          ? "from-green-500 to-green-600"
          : "from-red-500 to-red-600",
      bgColor: monthlyProfit >= 0 ? "bg-green-50" : "bg-red-50",
      iconColor: monthlyProfit >= 0 ? "text-green-600" : "text-red-600",
    },
    {
      title: "Yearly Revenue",
      value: yearlyRevenue,
      icon: DollarSign,
      color: "from-purple-500 to-pink-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
    {
      title: "Yearly Expenses",
      value: yearlyExpenses,
      icon: TrendingDown,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
    },
    {
      title: "Yearly Profit",
      value: yearlyProfit,
      icon: PiggyBank,
      color:
        yearlyProfit >= 0
          ? "from-green-500 to-green-600"
          : "from-red-500 to-red-600",
      bgColor: yearlyProfit >= 0 ? "bg-green-50" : "bg-red-50",
      iconColor: yearlyProfit >= 0 ? "text-green-600" : "text-red-600",
    },
  ];

  const cards = isAgency ? agencyCards : revenueCards;
  const gridCols = isAgency
    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
    : "grid-cols-1 md:grid-cols-3";

  return (
    <div className={`grid ${gridCols} gap-4 mb-8`}>
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
            </div>
            <div className="text-sm font-medium text-gray-600 mb-2">
              {card.title}
            </div>
            <div className="text-xl font-bold text-gray-900 mb-1">
              {formatCurrency(card.value)}
            </div>
            <div className="text-sm text-gray-500">
              {card.title.includes("Profit")
                ? "Net result"
                : "From completed orders"}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RevenueCards;
