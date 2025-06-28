import { useState } from 'react';
import apiManager from '../services/apiManager';

// 股價更新組件 - 按照架構文檔設計
function StockPriceUpdater({ transactions, onPricesUpdated, market, className = '' }) {
  const [updating, setUpdating] = useState(false);
  const [updateResults, setUpdateResults] = useState(null);

  // 獲取該市場的所有持股
  const getHoldingsForMarket = () => {
    const holdings = new Map();
    
    transactions
      .filter(tx => tx.market === market)
      .forEach(tx => {
        if (!holdings.has(tx.symbol)) {
          holdings.set(tx.symbol, {
            symbol: tx.symbol,
            market: tx.market,
            totalQuantity: 0
          });
        }
        
        const holding = holdings.get(tx.symbol);
        if (tx.type === 'BUY') {
          holding.totalQuantity += tx.quantity;
        } else {
          holding.totalQuantity -= tx.quantity;
        }
      });

    // 只返回仍有持股的股票
    return Array.from(holdings.values()).filter(h => h.totalQuantity > 0);
  };

  const updatePrices = async () => {
    setUpdating(true);
    setUpdateResults(null);

    try {
      const holdings = getHoldingsForMarket();
      
      if (holdings.length === 0) {
        setUpdateResults({
          success: true,
          message: `${getMarketName(market)}沒有持股需要更新`,
          results: [],
          errors: []
        });
        setUpdating(false);
        return;
      }

      const { results, errors } = await apiManager.updateMultipleStockPrices(holdings);
      
      setUpdateResults({
        success: true,
        message: `成功更新 ${results.length} 支股票，${errors.length} 支失敗`,
        results,
        errors,
        timestamp: new Date().toLocaleString()
      });

      // 回調父組件更新價格數據
      if (onPricesUpdated) {
        onPricesUpdated(results, market);
      }

    } catch (error) {
      setUpdateResults({
        success: false,
        message: `更新失敗: ${error.message}`,
        results: [],
        errors: []
      });
    } finally {
      setUpdating(false);
    }
  };

  const getMarketName = (marketCode) => {
    const names = {
      'US': '美股',
      'TW': '台股',
      'HK': '港股',
      'JP': '日股'
    };
    return names[marketCode] || marketCode;
  };

  const getMarketAPI = (marketCode) => {
    const apis = {
      'US': 'Finnhub API',
      'TW': 'FinMind API',
      'HK': '手動輸入',
      'JP': '手動輸入'
    };
    return apis[marketCode] || '未知';
  };

  const holdings = getHoldingsForMarket();
  const canUpdate = holdings.length > 0 && (market === 'US' || market === 'TW');

  return (
    <div className={`stock-price-updater ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">
            {getMarketName(market)} 股價更新
          </h3>
          <p className="text-sm text-gray-600">
            API: {getMarketAPI(market)} | 持股數量: {holdings.length} 支
          </p>
        </div>
        
        <button
          onClick={updatePrices}
          disabled={updating || !canUpdate}
          className={`px-4 py-2 rounded font-medium ${
            canUpdate
              ? updating
                ? 'bg-blue-300 text-blue-800 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {updating ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              更新中...
            </div>
          ) : (
            '🔄 更新股價'
          )}
        </button>
      </div>

      {!canUpdate && holdings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ {getMarketName(market)}暫不支援自動更新，請手動輸入價格
          </p>
        </div>
      )}

      {holdings.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 p-3 rounded mb-4">
          <p className="text-gray-600 text-sm">
            📝 {getMarketName(market)}目前沒有持股記錄
          </p>
        </div>
      )}

      {updateResults && (
        <div className={`p-4 rounded border ${
          updateResults.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-medium ${
              updateResults.success ? 'text-green-800' : 'text-red-800'
            }`}>
              {updateResults.success ? '✅' : '❌'} {updateResults.message}
            </span>
            {updateResults.timestamp && (
              <span className="text-sm text-gray-500">
                {updateResults.timestamp}
              </span>
            )}
          </div>

          {updateResults.results.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-green-700 mb-2">
                成功更新的股票:
              </h4>
              <div className="space-y-1">
                {updateResults.results.map((result, index) => (
                  <div key={index} className="text-sm text-green-600 flex justify-between">
                    <span>{result.symbol}</span>
                    <span>
                      {market === 'US' ? '$' : 'NT$'}{result.currentPrice}
                      <span className={`ml-2 ${
                        result.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ({result.changePercent >= 0 ? '+' : ''}{result.changePercent}%)
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {updateResults.errors.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-red-700 mb-2">
                更新失敗的股票:
              </h4>
              <div className="space-y-1">
                {updateResults.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-600">
                    {error.symbol}: {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 緩存狀態顯示 */}
      <div className="mt-4 text-xs text-gray-500">
        <button
          onClick={() => {
            const stats = apiManager.getCacheStats();
            alert(`緩存統計:\n總計: ${stats.total}\n有效: ${stats.valid}\n過期: ${stats.expired}`);
          }}
          className="underline hover:text-gray-700"
        >
          查看緩存狀態
        </button>
        <span className="mx-2">|</span>
        <button
          onClick={() => {
            apiManager.clearCache();
            alert('緩存已清除');
          }}
          className="underline hover:text-gray-700"
        >
          清除緩存
        </button>
      </div>
    </div>
  );
}

export default StockPriceUpdater;

