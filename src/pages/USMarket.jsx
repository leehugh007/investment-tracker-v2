import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StockPriceUpdater from '../components/StockPriceUpdater';
import QuickSellModal from '../components/QuickSellModal';
import { transactionService, stockPriceService, useLocalStore } from '../hooks/useLocalStore';

function USMarket() {
  const [stockPrices, setStockPrices] = useState({});
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);

  // 使用新的 localStorage hook
  const { 
    data: transactions, 
    loading, 
    error, 
    reload: reloadTransactions 
  } = useLocalStore(transactionService, []);

  // 過濾美股交易記錄
  const usTransactions = transactions.filter(tx => tx.market === 'US');

  useEffect(() => {
    // 載入股價數據
    const loadStockPrices = () => {
      const allPrices = stockPriceService.getAll();
      setStockPrices(allPrices);
    };

    loadStockPrices();
  }, []);

  const handlePricesUpdated = (priceResults, market) => {
    if (market === 'US') {
      const newPrices = {};
      priceResults.forEach(result => {
        newPrices[result.symbol] = result;
      });
      
      // 使用服務層更新股價
      stockPriceService.updateBatch(newPrices);
      setStockPrices(prev => ({ ...prev, ...newPrices }));
    }
  };

  const handleSellClick = (holding) => {
    setSelectedHolding(holding);
    setSellModalOpen(true);
  };

  const handleSellComplete = () => {
    reloadTransactions(); // 重新載入交易記錄
    setSellModalOpen(false);
    setSelectedHolding(null);
  };

  // 計算持股統計
  const calculateHoldings = () => {
    const holdings = new Map();
    
    usTransactions.forEach(tx => {
      if (!holdings.has(tx.symbol)) {
        holdings.set(tx.symbol, {
          symbol: tx.symbol,
          stockName: tx.stockName || tx.symbol,
          totalQuantity: 0,
          totalCost: 0,
          avgCost: 0
        });
      }
      
      const holding = holdings.get(tx.symbol);
      if (tx.type === 'BUY') {
        holding.totalCost += tx.quantity * tx.price;
        holding.totalQuantity += tx.quantity;
      } else {
        holding.totalQuantity -= tx.quantity;
        // 簡化處理：賣出時按平均成本計算
        holding.totalCost -= tx.quantity * holding.avgCost;
      }
      
      if (holding.totalQuantity > 0) {
        holding.avgCost = holding.totalCost / holding.totalQuantity;
      }
    });

    return Array.from(holdings.values()).filter(h => h.totalQuantity > 0);
  };

  // 處理載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <p className="text-gray-500">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 處理錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <p className="text-red-500">載入失敗: {error.message}</p>
            <button 
              onClick={reloadTransactions}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    );
  }

  const holdings = calculateHoldings();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🇺🇸 美股投資組合</h1>
          <p className="text-gray-600">Finnhub API 自動更新股價</p>
        </div>

        {/* 操作按鈕 */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Link
            to="/add-transaction/us"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            ➕ 新增交易
          </Link>
          <Link
            to="/analytics"
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            📊 歷史分析
          </Link>
          <button
            onClick={reloadTransactions}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            🔄 重新載入
          </button>
        </div>

        {/* 股價更新組件 */}
        <div className="mb-8">
          <StockPriceUpdater
            transactions={usTransactions}
            onPricesUpdated={handlePricesUpdated}
            market="US"
            className="bg-white rounded-lg shadow-md p-6"
          />
        </div>

        {/* 持股明細 */}
        {holdings.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">持股明細</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">股票代碼</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">公司名稱</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">持股數量</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">平均成本</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">當前價格</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">未實現損益</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">報酬率</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding, index) => {
                    const currentPrice = stockPrices[holding.symbol]?.currentPrice || 0;
                    const unrealizedPnL = currentPrice > 0 
                      ? (currentPrice - holding.avgCost) * holding.totalQuantity 
                      : 0;
                    const returnRate = holding.avgCost > 0 
                      ? ((currentPrice - holding.avgCost) / holding.avgCost * 100) 
                      : 0;

                    return (
                      <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-blue-600">
                          {holding.symbol}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {holding.stockName}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {holding.totalQuantity.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          ${holding.avgCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {currentPrice > 0 ? (
                            <div>
                              <div>${currentPrice.toFixed(2)}</div>
                              {stockPrices[holding.symbol] && (
                                <div className={`text-xs ${
                                  stockPrices[holding.symbol].changePercent >= 0 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  ({stockPrices[holding.symbol].changePercent >= 0 ? '+' : ''}
                                  {stockPrices[holding.symbol].changePercent}%)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">未更新</span>
                          )}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${
                          unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {currentPrice > 0 ? (
                            `${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(2)}`
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium ${
                          returnRate >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {currentPrice > 0 ? (
                            `${returnRate >= 0 ? '+' : ''}${returnRate.toFixed(2)}%`
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleSellClick(holding)}
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                          >
                            賣出
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 交易記錄 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">交易記錄</h2>
          
          {usTransactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">尚無美股交易記錄</p>
              <Link
                to="/add-transaction/us"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                新增第一筆交易
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">日期</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">股票代碼</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">公司名稱</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">動作</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">數量</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">價格</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">金額</th>
                  </tr>
                </thead>
                <tbody>
                  {usTransactions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((tx, index) => (
                      <tr key={tx.id || index} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-gray-700">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-medium text-blue-600">
                          {tx.symbol}
                        </td>
                        <td className="py-3 px-4 text-gray-700">
                          {tx.stockName || tx.symbol}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            tx.type === 'BUY' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.type === 'BUY' ? '買入' : '賣出'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {tx.quantity.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          ${tx.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          ${(tx.quantity * tx.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 快速賣出彈窗 */}
      <QuickSellModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        holding={selectedHolding}
        onSellComplete={handleSellComplete}
      />
    </div>
  );
}

export default USMarket;

