import { useState, useEffect } from 'react';
import ExchangeRateUpdater from '../components/ExchangeRateUpdater';
import UnifiedPnLDisplay from '../components/UnifiedPnLDisplay';
import CardSummary from '../components/CardSummary';

const Dashboard = () => {
  const [portfolioData, setPortfolioData] = useState({
    totalInvestment: 0,
    totalUnrealizedPnL: 0,
    totalRealizedPnL: 0,
    totalReturn: 0,
    marketDistribution: {
      US: 0,
      TW: 0,
      HK: 0,
      JP: 0
    }
  });

  useEffect(() => {
    // 從localStorage載入所有市場的交易數據
    const loadPortfolioData = () => {
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const marketTotals = { US: 0, TW: 0, HK: 0, JP: 0 };
      let totalInvestment = 0;

      transactions.forEach(tx => {
        if (tx.type === 'BUY') {
          const amount = tx.quantity * tx.price;
          marketTotals[tx.market] += amount;
          totalInvestment += amount;
        }
      });

      const marketDistribution = {};
      Object.keys(marketTotals).forEach(market => {
        marketDistribution[market] = totalInvestment > 0
          ? ((marketTotals[market] / totalInvestment) * 100).toFixed(1)
          : 0;
      });

      setPortfolioData({
        totalInvestment,
        totalUnrealizedPnL: 0,
        totalRealizedPnL: 0,
        totalReturn: 0,
        marketDistribution
      });
    };

    loadPortfolioData();
  }, []);

  // summary card 資料
  const cardList = [
    {
      title: '總投資金額',
      value: portfolioData.totalInvestment,
      valueColor: 'text-gray-900',
      icon: '💰',
      valueType: 'TWD'
    },
    {
      title: '未實現損益',
      value: portfolioData.totalUnrealizedPnL,
      valueColor: 'text-green-600',
      icon: '📈',
      valueType: 'TWD',
      sub: '待API整合後顯示'
    },
    {
      title: '已實現損益',
      value: portfolioData.totalRealizedPnL,
      valueColor: 'text-blue-600',
      icon: '💵',
      valueType: 'TWD',
      sub: '待計算引擎實現'
    },
    {
      title: '總報酬率',
      value: portfolioData.totalReturn,
      valueColor: 'text-purple-600',
      icon: '🎯',
      valueType: 'percent',
      sub: '待完整計算'
    }
  ];

  const getMarketFlag = (market) => {
    const flags = { US: '🇺🇸', TW: '🇹🇼', HK: '🇭🇰', JP: '🇯🇵' };
    return flags[market] || '';
  };

  const getMarketName = (market) => {
    const names = { US: '美股', TW: '台股', HK: '港股', JP: '日股' };
    return names[market] || market;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 投資組合總覽</h1>
          <p className="text-gray-600">統一顯示所有市場的投資狀況和損益分析</p>
        </div>

        {/* Summary Cards */}
        <CardSummary 
          data={{
            transactions: JSON.parse(localStorage.getItem('transactions') || '[]'),
            totalRealizedPnL: portfolioData.totalRealizedPnL,
            totalUnrealizedPnL: portfolioData.totalUnrealizedPnL,
            holdings: JSON.parse(localStorage.getItem('holdings') || '{}')
          }}
          formatCurrency={(value) => `TWD ${value.toLocaleString()}`}
        />

        {/* 市場分佈 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🌍 各市場分佈</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(portfolioData.marketDistribution).map(([market, percentage]) => (
              <div key={market} className="text-center p-4 bg-gray-50 border border-gray-200 rounded-lg transition-all duration-200 hover:shadow-md">
                <div className="text-2xl mb-2">{getMarketFlag(market)}</div>
                <div className="font-semibold text-gray-900">{getMarketName(market)}</div>
                <div className="text-lg font-bold text-blue-600">{percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* 匯率轉換服務 */}
        <ExchangeRateUpdater />

        {/* 快速導航 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🚀 快速導航</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <a
              href="/us"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-2xl mr-3">🇺🇸</span>
              <div>
                <div className="font-semibold text-gray-900">美股投資組合</div>
                <div className="text-sm text-gray-600">Finnhub API 自動更新</div>
              </div>
            </a>

            <a
              href="/tw"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-2xl mr-3">🇹🇼</span>
              <div>
                <div className="font-semibold text-gray-900">台股投資組合</div>
                <div className="text-sm text-gray-600">FinMind API 自動更新</div>
              </div>
            </a>

            <a
              href="/hk"
              className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <span className="text-2xl mr-3">🇭🇰</span>
              <div>
                <div className="font-semibold text-gray-900">港股投資組合</div>
                <div className="text-sm text-gray-600">手動輸入價格</div>
              </div>
            </a>

            <a
              href="/jp"
              className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <span className="text-2xl mr-3">🇯🇵</span>
              <div>
                <div className="font-semibold text-gray-900">日股投資組合</div>
                <div className="text-sm text-gray-600">手動輸入價格</div>
              </div>
            </a>

            <a
              href="/analytics"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-2xl mr-3">📈</span>
              <div>
                <div className="font-semibold text-gray-900">歷史分析</div>
                <div className="text-sm text-gray-600">已驗證的篩選功能</div>
              </div>
            </a>

            <a
              href="/add-transaction"
              className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <span className="text-2xl mr-3">➕</span>
              <div>
                <div className="font-semibold text-gray-900">新增交易</div>
                <div className="text-sm text-gray-600">記錄買賣交易</div>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;