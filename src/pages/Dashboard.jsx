import { useState, useEffect } from 'react';
import ExchangeRateUpdater from '../components/ExchangeRateUpdater';
import UnifiedPnLDisplay from '../components/UnifiedPnLDisplay';

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
      
      // 計算各市場分佈和總投資金額
      const marketTotals = { US: 0, TW: 0, HK: 0, JP: 0 };
      let totalInvestment = 0;
      
      transactions.forEach(tx => {
        if (tx.type === 'BUY') {
          const amount = tx.quantity * tx.price;
          marketTotals[tx.market] += amount;
          totalInvestment += amount;
        }
      });
      
      // 計算市場分佈百分比
      const marketDistribution = {};
      Object.keys(marketTotals).forEach(market => {
        marketDistribution[market] = totalInvestment > 0 
          ? ((marketTotals[market] / totalInvestment) * 100).toFixed(1)
          : 0;
      });
      
      setPortfolioData({
        totalInvestment,
        totalUnrealizedPnL: 0, // 待API整合後計算
        totalRealizedPnL: 0,   // 待損益計算引擎實現
        totalReturn: 0,        // 待計算
        marketDistribution
      });
    };
    
    loadPortfolioData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getMarketFlag = (market) => {
    const flags = {
      US: '🇺🇸',
      TW: '🇹🇼', 
      HK: '🇭🇰',
      JP: '🇯🇵'
    };
    return flags[market] || '';
  };

  const getMarketName = (market) => {
    const names = {
      US: '美股',
      TW: '台股',
      HK: '港股', 
      JP: '日股'
    };
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

        {/* 總覽卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總投資金額</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(portfolioData.totalInvestment)}
                </p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">未實現損益</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(portfolioData.totalUnrealizedPnL)}
                </p>
                <p className="text-sm text-gray-500">待API整合後顯示</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已實現損益</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(portfolioData.totalRealizedPnL)}
                </p>
                <p className="text-sm text-gray-500">待計算引擎實現</p>
              </div>
              <div className="text-3xl">💵</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總報酬率</p>
                <p className="text-2xl font-bold text-purple-600">
                  {portfolioData.totalReturn.toFixed(2)}%
                </p>
                <p className="text-sm text-gray-500">待完整計算</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>
        </div>

        {/* 市場分佈 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">🌍 各市場分佈</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(portfolioData.marketDistribution).map(([market, percentage]) => (
              <div key={market} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">{getMarketFlag(market)}</div>
                <div className="font-semibold text-gray-900">{getMarketName(market)}</div>
                <div className="text-lg font-bold text-blue-600">{percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* 統一損益計算 */}
        <UnifiedPnLDisplay />

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

