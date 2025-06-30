import { useState, useEffect } from 'react';
import apiManager from '../services/apiManager';

// 股票代號自動顯示名稱組件 - 按照架構文檔設計
function StockNameLookup({ symbol, market, onStockInfoChange, className = '' }) {
  const [stockInfo, setStockInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 防抖動查詢
    const timeoutId = setTimeout(() => {
      if (symbol && symbol.length >= 2) {
        lookupStockInfo(symbol, market);
      } else {
        setStockInfo(null);
        setError(null);
        if (onStockInfoChange) {
          onStockInfoChange(null);
        }
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [symbol, market]);

  const lookupStockInfo = async (stockSymbol, stockMarket) => {
    setLoading(true);
    setError(null);

    try {
      const info = await apiManager.getStockInfo(stockSymbol.toUpperCase(), stockMarket);
      setStockInfo(info);
      
      // 回調父組件
      if (onStockInfoChange) {
        onStockInfoChange(info);
      }
    } catch (err) {
      setError(err.message);
      setStockInfo(null);
      
      if (onStockInfoChange) {
        onStockInfoChange(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // 手動重新查詢
  const handleRefresh = () => {
    if (symbol && symbol.length >= 2) {
      lookupStockInfo(symbol, market);
    }
  };

  if (!symbol || symbol.length < 2) {
    return null;
  }

  return (
    <div className={`stock-name-lookup ${className}`}>
      {loading && (
        <div className="flex items-center text-blue-600 text-sm">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          查詢中...
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between text-red-600 text-sm bg-red-50 p-2 rounded">
          <span>❌ {error}</span>
          <button 
            onClick={handleRefresh}
            className="text-red-700 hover:text-red-800 underline ml-2"
          >
            重試
          </button>
        </div>
      )}

      {stockInfo && !loading && !error && (
        <div className="stock-info bg-green-50 p-3 rounded border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-green-800">
                {stockInfo.symbol} - {stockInfo.name}
              </div>
              <div className="text-sm text-green-600">
                {market === 'US' ? (
                  <>行業: {stockInfo.industry} | 國家: {stockInfo.country}</>
                ) : (
                  <>產業: {stockInfo.industry} | 市場: {stockInfo.market}</>
                )}
              </div>
            </div>
            <button 
              onClick={handleRefresh}
              className="text-green-700 hover:text-green-800 text-sm underline"
              title="重新查詢"
            >
              🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockNameLookup;

