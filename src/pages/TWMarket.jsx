import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StockPriceUpdater from '../components/StockPriceUpdater';
import QuickSellModal from '../components/QuickSellModal';
import unifiedPnLCalculator from '../utils/unifiedPnLCalculator';

function TWMarket() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [holdings, setHoldings] = useState([]);
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [realizedPnLStats, setRealizedPnLStats] = useState({
    totalRealizedPnL: 0,
    realizedReturnRate: 0
  });

  useEffect(() => {
    // 載入台股交易記錄
    const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const twTransactions = allTransactions.filter(t => t.market === 'TW');
    setTransactions(twTransactions);
    calculateHoldings(twTransactions);
  }, []);

  // 計算已實現損益
  useEffect(() => {
    const calculateRealizedPnL = async () => {
      try {
        if (transactions.length === 0) {
          setRealizedPnLStats({
            totalRealizedPnL: 0,
            realizedReturnRate: 0
          });
          return;
        }

        // 確保匯率已更新
        await unifiedPnLCalculator.updateExchangeRates();
        
        // 計算已實現損益
        const realizedPnL = unifiedPnLCalculator.calculateRealizedPnL(transactions);
        const totalRealizedTWD = realizedPnL.reduce((sum, item) => sum + (item.realizedPnL || 0), 0);
        
        // 計算已實現投資成本（用於計算已實現報酬率）
        const realizedCost = realizedPnL.reduce((sum, item) => {
          return sum + (item.quantity * item.avgCost);
        }, 0);
        
        const realizedReturnRate = realizedCost > 0 ? (totalRealizedTWD / realizedCost * 100) : 0;

        setRealizedPnLStats({
          totalRealizedPnL: totalRealizedTWD,
          realizedReturnRate
        });
      } catch (error) {
        console.error('計算已實現損益時發生錯誤:', error);
        setRealizedPnLStats({
          totalRealizedPnL: 0,
          realizedReturnRate: 0
        });
      }
    };

    calculateRealizedPnL();
  }, [transactions]);

  const calculateHoldings = (transactions) => {
    const holdingsMap = {};
    
    transactions.forEach(transaction => {
      if (!holdingsMap[transaction.symbol]) {
        holdingsMap[transaction.symbol] = {
          symbol: transaction.symbol,
          stockName: transaction.stockName || transaction.symbol,
          totalQuantity: 0,
          totalCost: 0,
          avgCost: 0,
          currentPrice: transaction.price, // 使用最後交易價格作為當前價格
          market: 'TW',
          currency: 'TWD'
        };
      }

      const holding = holdingsMap[transaction.symbol];
      
      if (transaction.type === 'BUY') {
        holding.totalQuantity += transaction.quantity;
        holding.totalCost += transaction.quantity * transaction.price;
      } else if (transaction.type === 'SELL') {
        holding.totalQuantity -= transaction.quantity;
        holding.totalCost -= transaction.quantity * holding.avgCost;
      }
      
      holding.avgCost = holding.totalQuantity > 0 ? holding.totalCost / holding.totalQuantity : 0;
      holding.currentPrice = transaction.price; // 更新為最新價格
    });

    const holdingsArray = Object.values(holdingsMap).filter(h => h.totalQuantity > 0);
    setHoldings(holdingsArray);
  };

  const calculateUnrealizedPnL = (holding) => {
    const unrealizedPnL = (holding.currentPrice - holding.avgCost) * holding.totalQuantity;
    const returnRate = ((holding.currentPrice - holding.avgCost) / holding.avgCost) * 100;
    return { unrealizedPnL, returnRate };
  };

  // 賣出處理函數
  const handleSellClick = (holding) => {
    setSelectedHolding(holding);
    setSellModalOpen(true);
  };

  const handleSellComplete = () => {
    // 重新載入交易記錄
    const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const twTransactions = allTransactions.filter(t => t.market === 'TW');
    setTransactions(twTransactions);
    calculateHoldings(twTransactions);
    setSellModalOpen(false);
    setSelectedHolding(null);
  };

  // 刪除持股功能
  const handleDeleteHolding = (symbol) => {
    if (confirm(`確定要刪除 ${symbol} 的所有交易記錄嗎？此操作無法復原。`)) {
      try {
        // 獲取所有交易記錄
        const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
        
        // 過濾掉該股票的所有交易記錄
        const filteredTransactions = allTransactions.filter(tx => 
          !(tx.symbol === symbol && tx.market === 'TW')
        );
        
        // 保存更新後的交易記錄
        localStorage.setItem('transactions', JSON.stringify(filteredTransactions));
        
        // 重新載入數據
        const twTransactions = filteredTransactions.filter(t => t.market === 'TW');
        setTransactions(twTransactions);
        calculateHoldings(twTransactions);
        
        alert(`已成功刪除 ${symbol} 的所有交易記錄`);
      } catch (error) {
        console.error('刪除持股時發生錯誤:', error);
        alert('刪除失敗，請稍後再試');
      }
    }
  };

  // 計算投資組合統計
  const calculatePortfolioStats = (holdings) => {
    let totalValue = 0;
    let totalCost = 0;
    let totalUnrealizedPnL = 0;

    holdings.forEach(holding => {
      const currentPrice = stockPrices[holding.symbol]?.currentPrice || holding.currentPrice || 0;
      const marketValue = currentPrice * holding.totalQuantity;
      const cost = holding.totalCost;
      const unrealizedPnL = marketValue - cost;

      totalValue += marketValue;
      totalCost += cost;
      totalUnrealizedPnL += unrealizedPnL;
    });

    const totalReturnRate = totalCost > 0 ? (totalUnrealizedPnL / totalCost * 100) : 0;

    return {
      totalValue,
      totalCost,
      totalUnrealizedPnL,
      totalReturnRate
    };
  };

  const handlePricesUpdated = (priceResults, market) => {
    if (market === 'TW') {
      const newPrices = {};
      priceResults.forEach(result => {
        newPrices[result.symbol] = result;  // 直接使用 result 物件，和美股一樣
      });
      setStockPrices(prev => ({ ...prev, ...newPrices }));
    }
  };

  const portfolioStats = calculatePortfolioStats(holdings);

  return (
    <div className="container mx-auto px-4 py-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">🇹🇼</span>
          <h1 className="text-2xl font-bold text-gray-800">台股投資組合</h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/add-transaction/tw')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <span>➕</span>
            <span>新增交易</span>
          </button>
        </div>
      </div>

      {/* API狀態說明 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-green-600 font-semibold">FinMind API 自動更新股價</span>
          <span className="text-sm text-green-600">
            (支援台股即時價格查詢和股票名稱自動顯示)
          </span>
        </div>
      </div>

      {/* 投資組合統計卡片 */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總市值</p>
                <p className="text-2xl font-bold">
                  NT${portfolioStats.totalValue.toLocaleString()}
                </p>
              </div>
              <div className="text-blue-500 text-2xl">💰</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總成本</p>
                <p className="text-2xl font-bold">
                  NT${portfolioStats.totalCost.toLocaleString()}
                </p>
              </div>
              <div className="text-gray-500 text-2xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">未實現損益</p>
                <p className={`text-2xl font-bold ${
                  portfolioStats.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {portfolioStats.totalUnrealizedPnL >= 0 ? '+' : ''}
                  NT${portfolioStats.totalUnrealizedPnL.toLocaleString()}
                </p>
              </div>
              <div className={`text-2xl ${
                portfolioStats.totalUnrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {portfolioStats.totalUnrealizedPnL >= 0 ? '📈' : '📉'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總報酬率</p>
                <p className={`text-2xl font-bold ${
                  portfolioStats.totalReturnRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {portfolioStats.totalReturnRate >= 0 ? '+' : ''}
                  {portfolioStats.totalReturnRate.toFixed(2)}%
                </p>
              </div>
              <div className="text-blue-500 text-2xl">📊</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已實現損益</p>
                <p className={`text-2xl font-bold ${
                  realizedPnLStats.totalRealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {realizedPnLStats.totalRealizedPnL >= 0 ? '+' : ''}
                  NT${realizedPnLStats.totalRealizedPnL.toLocaleString()}
                </p>
              </div>
              <div className={`text-2xl ${
                realizedPnLStats.totalRealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {realizedPnLStats.totalRealizedPnL >= 0 ? '💰' : '💸'}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">已實現報酬率</p>
                <p className={`text-2xl font-bold ${
                  realizedPnLStats.realizedReturnRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {realizedPnLStats.realizedReturnRate >= 0 ? '+' : ''}
                  {realizedPnLStats.realizedReturnRate.toFixed(2)}%
                </p>
              </div>
              <div className="text-blue-500 text-2xl">📊</div>
            </div>
          </div>
        </div>
      )}

      {/* 股價更新組件 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <StockPriceUpdater
          transactions={transactions}
          onPricesUpdated={handlePricesUpdated}
          market="TW"
        />
      </div>

      {/* 持股明細 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">持股明細</h2>
        
        {holdings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">📈</div>
            <div className="text-gray-500 mb-4">台股頁面已成功載入</div>
            <div className="text-sm text-gray-400">
              交易記錄數量: {transactions.length}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">股票代碼</th>
                  <th className="text-left p-2">公司名稱</th>
                  <th className="text-right p-2">持股數量</th>
                  <th className="text-right p-2">平均成本</th>
                  <th className="text-right p-2">當前價格</th>
                  <th className="text-right p-2">未實現損益</th>
                  <th className="text-right p-2">報酬率</th>
                  <th className="text-center p-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => {
                  const currentPrice = stockPrices[holding.symbol]?.currentPrice || holding.currentPrice || 0;
                  const { unrealizedPnL, returnRate } = calculateUnrealizedPnL({
                    ...holding,
                    currentPrice: currentPrice
                  });
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-semibold">{holding.symbol}</td>
                      <td className="p-2">{holding.stockName}</td>
                      <td className="p-2 text-right">{holding.totalQuantity.toLocaleString()}</td>
                      <td className="p-2 text-right">NT${holding.avgCost.toFixed(2)}</td>
                      <td className="p-2 text-right">
                        {stockPrices[holding.symbol] ? (
                          <div>
                            <div className="font-semibold">NT${currentPrice.toFixed(2)}</div>
                            {stockPrices[holding.symbol].lastUpdated && (
                              <div className="text-xs text-gray-500">
                                {stockPrices[holding.symbol].lastUpdated}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>NT${currentPrice.toFixed(2)}</div>
                        )}
                      </td>
                      <td className={`p-2 text-right ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currentPrice > 0 ? (
                          `${unrealizedPnL >= 0 ? '+' : ''}NT${unrealizedPnL.toLocaleString()}`
                        ) : (
                          'NT$0'
                        )}
                      </td>
                      <td className={`p-2 text-right ${returnRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {currentPrice > 0 ? (
                          `${returnRate >= 0 ? '+' : ''}${returnRate.toFixed(2)}%`
                        ) : (
                          '+0.00%'
                        )}
                      </td>
                      <td className="p-2 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleSellClick(holding)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                          >
                            賣出
                          </button>
                          <button
                            onClick={() => handleDeleteHolding(holding.symbol)}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 交易記錄 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">交易記錄</h2>
        
        {transactions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            尚無台股交易記錄
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx, index) => (
              <div key={index} className="border border-gray-200 rounded p-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{tx.symbol}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    tx.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tx.type === 'BUY' ? '買入' : '賣出'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {tx.quantity} 股 @ NT${tx.price} = NT${(tx.quantity * tx.price).toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">{tx.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 賣出模態框 */}
      <QuickSellModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        holding={selectedHolding}
        onSellComplete={handleSellComplete}
      />
    </div>
  );
}

export default TWMarket;

