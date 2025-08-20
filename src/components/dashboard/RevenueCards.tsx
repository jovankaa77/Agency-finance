import React from 'react';
import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface RevenueCardsProps {
  weeklyRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

const RevenueCards: React.FC<RevenueCardsProps> = ({
  weeklyRevenue,
  monthlyRevenue,
  yearlyRevenue
}) => {
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const cards = [
    {
      title: 'Weekly Revenue',
      value: weeklyRevenue,
      icon: Calendar,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      title: 'Monthly Revenue',
      value: monthlyRevenue,
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Yearly Revenue',
      value: yearlyRevenue,
      icon: DollarSign,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.iconColor}`} />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(card.value)}
            </div>
            <div className="text-sm text-gray-500">
              From completed orders
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RevenueCards;