import React from "react";

const CardSummary = ({ data, formatCurrency }) => {
  // 計算總交易數
  const totalTransactions = data?.transactions?.length || 0;
  
  // 計算已實現損益
  const realizedPnL = data?.totalRealizedPnL || 0;
  
  // 計算未實現損益
  const unrealizedPnL = data?.totalUnrealizedPnL || 0;
  
  // 計算持股數量
  const holdingsCount = data?.holdings ? Object.keys(data.holdings).length : 0;

  const cards = [
    {
      id: "transactions",
      title: "總交易數",
      value: totalTransactions,
      subtitle: "買入和出交易",
      icon: "📊",
      color: "text-gray-900",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200"
    },
    {
      id: "realized",
      title: "已實現損益",
      value: formatCurrency ? formatCurrency(realizedPnL) : `TWD ${realizedPnL.toLocaleString()}`,
      subtitle: "已結算的損益",
      icon: "💰",
      color: realizedPnL >= 0 ? "text-green-600" : "text-red-600",
      bgColor: realizedPnL >= 0 ? "bg-green-50" : "bg-red-50",
      borderColor: realizedPnL >= 0 ? "border-green-200" : "border-red-200"
    },
    {
      id: "unrealized",
      title: "未實現損益",
      value: formatCurrency ? formatCurrency(unrealizedPnL) : `TWD ${unrealizedPnL.toLocaleString()}`,
      subtitle: "當前持股損益",
      icon: "📈",
      color: unrealizedPnL >= 0 ? "text-green-600" : "text-red-600",
      bgColor: unrealizedPnL >= 0 ? "bg-green-50" : "bg-red-50",
      borderColor: unrealizedPnL >= 0 ? "border-green-200" : "border-red-200"
    },
    {
      id: "holdings",
      title: "持股數量",
      value: holdingsCount,
      subtitle: "不同標的數量",
      icon: "$",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`${card.bgColor} ${card.borderColor} border rounded-lg p-4 transition-all duration-200 hover:shadow-md`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <span className="text-lg mr-2">{card.icon}</span>
                <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              </div>
              <div className={`text-2xl font-bold ${card.color} mb-1`}>
                {card.value}
              </div>
              <p className="text-xs text-gray-500">{card.subtitle}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CardSummary;

