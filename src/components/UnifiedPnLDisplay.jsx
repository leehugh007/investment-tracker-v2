import { useState, useEffect } from 'react';
import unifiedPnLCalculator from '../utils/unifiedPnLCalculator';

const UnifiedPnLDisplay = () => {
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculatePortfolio = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 從localStorage載入交易數據
      const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      
      if (transactions.length === 0) {
        setError('沒有交易記錄，請先新增一些交易');
        return;
      }

      // 計算統一損益
      const summary = await unifiedPnLCalculator.calculatePortfolioSummary(transactions);
      setPortfolioSummary(summary);
      
    } catch (err) {
      setError(err.message);
      console.error('損益計算失敗:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 頁面載入時自動計算
    calculatePortfolio();
  }, []);

  const getMarketFlag = (market) => {
    const flags = { US: '🇺🇸', TW: '🇹🇼', HK: '🇭🇰', JP: '🇯🇵' };
    return flags[market] || '';
  };

  const getMarketName = (market) => {
    const names = { US: '美股', TW: '台股', HK: '港股', JP: '日股' };
    return names[market] || market;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-2xl mb-2">⏳</div>
            <p className="text-gray-600">正在計算多市場統一損益...</p>
            <p className="text-sm text-gray-500 mt-1">包含匯率轉換和FIFO計算</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <div className="flex items-center">
            <span className="text-2xl mr-3">❌</span>
            <div>
              <p className="text-red-600 font-semibold">計算失敗</p>
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          </div>
          <button
            onClick={calculatePortfolio}
            className="mt-3 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            重新計算
          </button>
        </div>
      </div>
    );
  }

  if (!portfolioSummary) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">點擊按鈕開始計算統一損益</p>
          <button
            onClick={calculatePortfolio}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            📊 計算多市場損益
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 總覽卡片 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">💰 統一損益總覽 (TWD)</h3>
          <button
            onClick={calculatePortfolio}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>重新計算</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">總投資成本</p>
            <p className="text-2xl font-bold text-blue-700">
              {unifiedPnLCalculator.formatTWD(portfolioSummary.totalInvestmentTWD)}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">當前市值</p>
            <p className="text-2xl font-bold text-green-700">
              {unifiedPnLCalculator.formatTWD(portfolioSummary.totalCurrentValueTWD)}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">總損益</p>
            <p className={`text-2xl font-bold ${portfolioSummary.totalPnLTWD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {unifiedPnLCalculator.formatTWD(portfolioSummary.totalPnLTWD)}
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600 font-medium">總報酬率</p>
            <p className={`text-2xl font-bold ${portfolioSummary.totalReturnRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioSummary.totalReturnRate}%
            </p>
          </div>
        </div>

        {/* 已實現 vs 未實現損益 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">已實現損益</p>
            <p className={`text-xl font-bold ${portfolioSummary.totalRealizedPnLTWD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {unifiedPnLCalculator.formatTWD(portfolioSummary.totalRealizedPnLTWD)}
            </p>
            <p className="text-xs text-gray-500">FIFO計算</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium">未實現損益</p>
            <p className={`text-xl font-bold ${portfolioSummary.totalUnrealizedPnLTWD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {unifiedPnLCalculator.formatTWD(portfolioSummary.totalUnrealizedPnLTWD)}
            </p>
            <p className="text-xs text-gray-500">即時股價計算</p>
          </div>
        </div>
      </div>

      {/* 市場分佈 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold mb-4">🌍 各市場分佈 (按當前市值)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(portfolioSummary.marketDistribution).map(([market, percentage]) => (
            <div key={market} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-1">{getMarketFlag(market)}</div>
              <div className="font-semibold text-gray-900">{getMarketName(market)}</div>
              <div className="text-lg font-bold text-blue-600">{percentage}%</div>
              <div className="text-sm text-gray-600">
                {unifiedPnLCalculator.formatTWD(portfolioSummary.marketTotals[market])}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 未實現損益明細 */}
      {portfolioSummary.unrealizedPnL.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-bold mb-4">📈 持股明細 (未實現損益)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">市場</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">股票</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">數量</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">平均成本</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">當前價格</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">未實現損益(TWD)</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">報酬率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {portfolioSummary.unrealizedPnL.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <span className="flex items-center">
                        {getMarketFlag(item.market)}
                        <span className="ml-1 text-sm">{getMarketName(item.market)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium">{item.symbol}</td>
                    <td className="px-4 py-2 text-right">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{item.avgCost.toFixed(2)} {item.currency}</td>
                    <td className="px-4 py-2 text-right">{item.currentPrice.toFixed(2)} {item.currency}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${item.unrealizedPnLTWD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {unifiedPnLCalculator.formatTWD(item.unrealizedPnLTWD)}
                    </td>
                    <td className={`px-4 py-2 text-right font-semibold ${item.returnRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.returnRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 已實現損益明細 */}
      {portfolioSummary.realizedPnL.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h4 className="text-lg font-bold mb-4">💵 已實現損益明細 (FIFO)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">市場</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">股票</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">賣出日期</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">數量</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">賣出價格</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">平均成本</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">已實現損益(TWD)</th>
                  <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">報酬率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {portfolioSummary.realizedPnL.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <span className="flex items-center">
                        {getMarketFlag(item.market)}
                        <span className="ml-1 text-sm">{getMarketName(item.market)}</span>
                      </span>
                    </td>
                    <td className="px-4 py-2 font-medium">{item.symbol}</td>
                    <td className="px-4 py-2">{item.sellDate}</td>
                    <td className="px-4 py-2 text-right">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{item.sellPrice.toFixed(2)} {item.currency}</td>
                    <td className="px-4 py-2 text-right">{item.avgCost.toFixed(2)} {item.currency}</td>
                    <td className={`px-4 py-2 text-right font-semibold ${item.realizedPnLTWD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {unifiedPnLCalculator.formatTWD(item.realizedPnLTWD)}
                    </td>
                    <td className={`px-4 py-2 text-right font-semibold ${item.returnRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.returnRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 匯率資訊 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h4 className="text-lg font-bold mb-4">💱 匯率資訊</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded p-3">
            <p className="text-sm text-blue-600">美元 → 台幣</p>
            <p className="text-lg font-bold text-blue-700">
              1 USD = {portfolioSummary.exchangeRates.USD_TWD.toFixed(4)} TWD
            </p>
          </div>
          <div className="bg-red-50 rounded p-3">
            <p className="text-sm text-red-600">港幣 → 台幣</p>
            <p className="text-lg font-bold text-red-700">
              1 HKD = {portfolioSummary.exchangeRates.HKD_TWD.toFixed(4)} TWD
            </p>
          </div>
          <div className="bg-yellow-50 rounded p-3">
            <p className="text-sm text-yellow-600">日圓 → 台幣</p>
            <p className="text-lg font-bold text-yellow-700">
              1 JPY = {portfolioSummary.exchangeRates.JPY_TWD.toFixed(4)} TWD
            </p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          最後更新: {portfolioSummary.lastRateUpdate}
        </p>
      </div>
    </div>
  );
};

export default UnifiedPnLDisplay;

