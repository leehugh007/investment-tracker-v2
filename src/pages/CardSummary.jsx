import React from "react";

const cards = [
  {
    label: "總投資金額",
    valueKey: "totalInvestment",
    color: "text-gray-900",
    bg: "bg-yellow-100",
    icon: "💰"
  },
  {
    label: "未實現損益",
    valueKey: "totalUnrealizedPnL",
    color: "text-green-600",
    bg: "bg-green-100",
    icon: "📈",
    tip: "待API整合"
  },
  {
    label: "已實現損益",
    valueKey: "totalRealizedPnL",
    color: "text-blue-600",
    bg: "bg-blue-100",
    icon: "💵",
    tip: "待計算"
  },
  {
    label: "總報酬率",
    valueKey: "totalReturn",
    color: "text-purple-600",
    bg: "bg-purple-100",
    icon: "🎯",
    isPercent: true,
    tip: "待完整計算"
  }
];

export default function CardSummary({ data, formatCurrency }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((item) => (
        <div
          key={item.label}
          className={`rounded-2xl shadow transition hover:scale-105 ${item.bg} p-6`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>
                {item.isPercent
                  ? (data[item.valueKey] || 0).toFixed(2) + "%"
                  : formatCurrency(data[item.valueKey] || 0)}
              </p>
              {item.tip && (
                <p className="text-xs text-gray-400">{item.tip}</p>
              )}
            </div>
            <div className="text-3xl">{item.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}