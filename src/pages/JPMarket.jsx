import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  BarChart3, 
  Edit3,
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  AlertCircle
} from 'lucide-react';
import unifiedPnLCalculator from '../utils/unifiedPnLCalculator';

const JPMarket = () => {
  const [transactions, setTransactions] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [stockPrices, setStockPrices] = useState({});
  const [editingPrice, setEditingPrice] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [realizedPnLStats, setRealizedPnLStats] = useState({
    totalRealizedPnL: 0,
    realizedReturnRate: 0
  });

  useEffect(() => {
    try {
      loadTransactions();
    } catch (error) {
      console.error('載入交易記錄時發生錯誤:', error);
    }
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
        const totalRealizedJPY = realizedPnL.reduce((sum, item) => sum + (item.realizedPnL || 0), 0);
        
        // 計算已實現投資成本（用於計算已實現報酬率）
        const realizedCost = realizedPnL.reduce((sum, item) => {
          return sum + (item.totalSoldCost || 0);
        }, 0);
        
        const realizedReturnRate = realizedCost > 0 ? (totalRealizedJPY / realizedCost * 100) : 0;
        
        setRealizedPnLStats({
          totalRealizedPnL: totalRealizedJPY,
          realizedReturnRate: realizedReturnRate
        });
      } catch (error) {
        console.error('計算已實現損益失敗:', error);
        setRealizedPnLStats({
          totalRealizedPnL: 0,
          realizedReturnRate: 0
        });
      }
    };

    calculateRealizedPnL();
  }, [transactions]);

  const loadTransactions = () => {
    try {
      const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const jpTransactions = allTransactions.filter(tx => tx.market === 'JP');
      setTransactions(jpTransactions);
      
      const holdingsArray = calculateHoldings(jpTransactions);
      setHoldings(holdingsArray);
    } catch (error) {
      console.error('載入交易記錄失敗:', error);
      setTransactions([]);
      setHoldings([]);
    }
  };

  // 自動股價更新功能
  const updateStockPrice = async (symbol) => {
    try {
      // 調用API獲取最新股價
      const response = await fetch(`/api?symbol=${symbol}&action=price`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // 修復：API返回的是price字段，不是currentPrice
      const currentPrice = data.price || data.currentPrice;
      
      if (!currentPrice) {
        throw new Error('API未返回有效價格');
      }
      
      // 更新持股的當前價格
      setHoldings(prev => prev.map(holding => 
        holding.symbol === symbol 
          ? { 
              ...holding, 
              currentPrice: currentPrice,
              lastUpdated: new Date().toLocaleString(),
              autoUpdated: true
            }
          : holding
      ));
      
      return { success: true, price: currentPrice };
    } catch (error) {
      console.error('自動更新股價失敗:', error);
      return { success: false, error: error.message };
    }
  };

  // 批量更新所有持股價格
  const updateAllStockPrices = async () => {
    if (!Array.isArray(holdings) || holdings.length === 0) return;
    
    const updatePromises = holdings.map(holding => updateStockPrice(holding.symbol));
    const results = await Promise.all(updatePromises);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    // 可以添加通知或狀態顯示
    console.log(`股價更新完成: ${successCount} 成功, ${failCount} 失敗`);
  };

  const updateManualPrice = (symbol, newPrice) => {
    const priceValue = parseFloat(newPrice);
    if (isNaN(priceValue) || priceValue <= 0) return;

    setStockPrices(prev => ({
      ...prev,
      [symbol]: {
        currentPrice: priceValue,
        lastUpdated: new Date().toLocaleString()
      }
    }));
    setEditingPrice(null);
    setNewPrice('');
  };

  const calculateHoldings = (transactions) => {
    try {
      const holdingsMap = {};
      
      transactions.forEach(transaction => {
        if (!holdingsMap[transaction.symbol]) {
          holdingsMap[transaction.symbol] = {
            symbol: transaction.symbol,
            stockName: transaction.stockName || transaction.symbol,
            totalQuantity: 0,
            totalCost: 0,
            avgCost: 0,
            currentPrice: transaction.price || 0
          };
        }
        
        const holding = holdingsMap[transaction.symbol];
        if (transaction.type === 'BUY') {
          holding.totalCost += transaction.quantity * transaction.price;
          holding.totalQuantity += transaction.quantity;
        } else {
          holding.totalQuantity -= transaction.quantity;
          holding.totalCost -= transaction.quantity * holding.avgCost;
        }
        
        holding.avgCost = holding.totalQuantity > 0 ? holding.totalCost / holding.totalQuantity : 0;
        holding.currentPrice = transaction.price || 0;
      });

      return Object.values(holdingsMap).filter(h => h.totalQuantity > 0);
    } catch (error) {
      console.error('計算持股失敗:', error);
      return [];
    }
  };

  // 簡化的投資組合統計
  const calculatePortfolioStats = (holdings) => {
    try {
      if (!Array.isArray(holdings) || holdings.length === 0) {
        return {
          totalValue: 0,
          totalCost: 0,
          totalUnrealizedPnL: 0,
          totalReturnRate: 0
        };
      }

      let totalValue = 0;
      let totalCost = 0;

      holdings.forEach(holding => {
        if (!holding || typeof holding !== 'object') return;
        
        const currentPrice = holding.currentPrice || 0;
        const totalQuantity = holding.totalQuantity || 0;
        const totalCostValue = holding.totalCost || 0;
        
        const marketValue = currentPrice * totalQuantity;
        totalValue += marketValue;
        totalCost += totalCostValue;
      });

      const totalUnrealizedPnL = totalValue - totalCost;
      const totalReturnRate = totalCost > 0 ? (totalUnrealizedPnL / totalCost * 100) : 0;

      return {
        totalValue,
        totalCost,
        totalUnrealizedPnL,
        totalReturnRate
      };
    } catch (error) {
      console.error('計算投資組合統計失敗:', error);
      return {
        totalValue: 0,
        totalCost: 0,
        totalUnrealizedPnL: 0,
        totalReturnRate: 0
      };
    }
  };

  const portfolioStats = calculatePortfolioStats(holdings);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🇯🇵 日股投資組合
        </h1>
        <Link 
          to="/add-transaction/jp"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
        >
          <Plus size={20} />
          新增交易
        </Link>
      </div>

      {/* 手動更新價格說明 */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-800">
            <Edit3 size={20} />
            <span className="font-semibold">💡 股價更新功能</span>
          </div>
          <button
            onClick={updateAllStockPrices}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            disabled={!holdings || holdings.length === 0}
          >
            <Activity size={16} />
            🔄 自動更新
          </button>
        </div>
        <p className="text-green-700 mt-1">
          📊 在持股明細中點擊 "當前價格" 欄位即可手動更新股價
        </p>
        <p className="text-green-600 text-sm mt-1">
          ✨ 更新後會顯示最後更新時間，幫助您追蹤價格變化
        </p>
      </div>

      {/* 投資組合統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總市值</p>
              <p className="text-2xl font-bold">¥{portfolioStats.totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總成本</p>
              <p className="text-2xl font-bold">¥{portfolioStats.totalCost.toLocaleString()}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">未實現損益</p>
              <p className={`text-2xl font-bold ${portfolioStats.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioStats.totalUnrealizedPnL >= 0 ? '+' : ''}¥{portfolioStats.totalUnrealizedPnL.toLocaleString()}
              </p>
            </div>
            {portfolioStats.totalUnrealizedPnL >= 0 ? 
              <TrendingUp className="h-8 w-8 text-green-600" /> : 
              <TrendingDown className="h-8 w-8 text-red-600" />
            }
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總報酬率</p>
              <p className={`text-2xl font-bold ${portfolioStats.totalReturnRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioStats.totalReturnRate >= 0 ? '+' : ''}{portfolioStats.totalReturnRate.toFixed(2)}%
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">已實現損益</p>
              <p className={`text-2xl font-bold ${realizedPnLStats.totalRealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {realizedPnLStats.totalRealizedPnL >= 0 ? '+' : ''}¥{realizedPnLStats.totalRealizedPnL.toLocaleString()}
              </p>
            </div>
            {realizedPnLStats.totalRealizedPnL >= 0 ? 
              <TrendingUp className="h-8 w-8 text-green-600" /> : 
              <TrendingDown className="h-8 w-8 text-red-600" />
            }
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">已實現報酬率</p>
              <p className={`text-2xl font-bold ${realizedPnLStats.realizedReturnRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {realizedPnLStats.realizedReturnRate >= 0 ? '+' : ''}{realizedPnLStats.realizedReturnRate.toFixed(2)}%
              </p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* 持股明細 */}
      {holdings.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">持股明細</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">股票代碼</th>
                  <th className="text-left p-2">公司名稱</th>
                  <th className="text-left p-2">持股數量</th>
                  <th className="text-left p-2">平均成本</th>
                  <th className="text-left p-2">當前價格</th>
                  <th className="text-left p-2">市值</th>
                  <th className="text-left p-2">未實現損益</th>
                  <th className="text-left p-2">報酬率</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => {
                  const currentPrice = stockPrices[holding.symbol]?.currentPrice || holding.currentPrice;
                  const marketValue = currentPrice * holding.totalQuantity;
                  const unrealizedPnL = marketValue - holding.totalCost;
                  const returnRate = holding.totalCost > 0 ? (unrealizedPnL / holding.totalCost * 100) : 0;
                  const lastUpdated = stockPrices[holding.symbol]?.lastUpdated;
                  
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono">{holding.symbol}</td>
                      <td className="p-2">{holding.stockName}</td>
                      <td className="p-2">{holding.totalQuantity.toLocaleString()}</td>
                      <td className="p-2">¥{holding.avgCost.toFixed(0)}</td>
                      <td className="p-2">
                        {editingPrice === holding.symbol ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              className="w-20 px-2 py-1 border rounded text-sm"
                              placeholder="新價格"
                              step="0.01"
                            />
                            <button
                              onClick={() => updateManualPrice(holding.symbol, newPrice)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                setEditingPrice(null);
                                setNewPrice('');
                              }}
                              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                            >
                              ✗
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <button
                              onClick={() => {
                                setEditingPrice(holding.symbol);
                                setNewPrice(currentPrice.toString());
                              }}
                              className="text-blue-600 hover:text-blue-800 text-left"
                            >
                              ¥{currentPrice.toFixed(0)}
                            </button>
                            {lastUpdated && (
                              <span className="text-xs text-gray-500">
                                {lastUpdated}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-2">¥{marketValue.toLocaleString()}</td>
                      <td className={`p-2 ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {unrealizedPnL >= 0 ? '+' : ''}¥{unrealizedPnL.toLocaleString()}
                      </td>
                      <td className={`p-2 ${returnRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
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
      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">交易記錄</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">日期</th>
                  <th className="text-left p-2">股票代碼</th>
                  <th className="text-left p-2">公司名稱</th>
                  <th className="text-left p-2">動作</th>
                  <th className="text-left p-2">數量</th>
                  <th className="text-left p-2">價格</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">{transaction.date}</td>
                    <td className="p-2 font-mono">{transaction.symbol}</td>
                    <td className="p-2">{transaction.stockName || transaction.symbol}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type === 'BUY' ? '買入' : '賣出'}
                      </span>
                    </td>
                    <td className="p-2">{transaction.quantity.toLocaleString()}</td>
                    <td className="p-2">¥{transaction.price.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {transactions.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">📈 日股頁面運作正常</p>
            <p className="text-gray-400 mt-2">尚無日股交易記錄</p>
            <Link 
              to="/add-transaction/jp"
              className="mt-4 inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
            >
              新增第一筆日股交易
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default JPMarket;

