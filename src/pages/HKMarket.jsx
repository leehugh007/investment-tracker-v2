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

const HKMarket = () => {
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
    loadTransactions();
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
        const totalRealizedHKD = realizedPnL.reduce((sum, item) => sum + (item.realizedPnL || 0), 0);
        
        // 計算已實現投資成本（用於計算已實現報酬率）
        const realizedCost = realizedPnL.reduce((sum, item) => {
          return sum + (item.quantity * item.avgCost);
        }, 0);
        
        const realizedReturnRate = realizedCost > 0 ? (totalRealizedHKD / realizedCost * 100) : 0;

        setRealizedPnLStats({
          totalRealizedPnL: totalRealizedHKD,
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

  const loadTransactions = () => {
    const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const hkTransactions = allTransactions.filter(tx => tx.market === 'HK');
    setTransactions(hkTransactions);
    
    const holdingsArray = calculateHoldings(hkTransactions);
    setHoldings(holdingsArray);
  };

  const calculateHoldings = (transactions) => {
    const holdingsMap = {};
    
    transactions.forEach(transaction => {
      if (!holdingsMap[transaction.symbol]) {
        holdingsMap[transaction.symbol] = {
          symbol: transaction.symbol,
          stockName: transaction.stockName || transaction.symbol,
          totalQuantity: 0,
          totalCost: 0,
          avgCost: 0
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
    });

    const holdingsArray = Object.values(holdingsMap).filter(h => h.totalQuantity > 0);
    return holdingsArray;
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
      
      // 更新持股的當前價格
      setHoldings(prev => prev.map(holding => 
        holding.symbol === symbol 
          ? { 
              ...holding, 
              currentPrice: data.currentPrice,
              lastUpdated: new Date().toLocaleString(),
              autoUpdated: true
            }
          : holding
      ));
      
      return { success: true, price: data.currentPrice };
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

  // 計算投資組合統計
  const calculatePortfolioStats = (holdings) => {
    let totalValue = 0;
    let totalCost = 0;
    let totalUnrealizedPnL = 0;

    holdings.forEach(holding => {
      const currentPrice = stockPrices[holding.symbol]?.currentPrice || holding.avgCost;
      const marketValue = currentPrice * holding.totalQuantity;
      const cost = holding.totalCost;
      const unrealizedPnL = marketValue - cost;

      totalValue += marketValue;
      totalCost += cost;
      totalUnrealizedPnL += unrealizedPnL;
    });

    const totalReturnRate = totalCost > 0 ? (totalUnrealizedPnL / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalUnrealizedPnL,
      totalReturnRate
    };
  };

  const portfolioStats = calculatePortfolioStats(holdings);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🇭🇰 港股投資組合
        </h1>
        <Link 
          to="/add-transaction/hk" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus size={20} />
          新增交易
        </Link>
      </div>

      {/* 手動更新價格說明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 text-blue-800">
          <Edit3 size={20} />
          <span className="font-semibold">💡 股價更新功能</span>
        </div>
        <p className="text-blue-700 mt-1">
          📊 在持股明細中點擊 "當前價格" 欄位即可手動更新股價
        </p>
        <p className="text-blue-600 text-sm mt-1">
          ✨ 更新後會顯示最後更新時間，幫助您追蹤價格變化
        </p>
      </div>

      {/* 投資組合統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總市值</p>
              <p className="text-2xl font-bold">HK${portfolioStats.totalValue.toLocaleString()}</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">總成本</p>
              <p className="text-2xl font-bold">HK${portfolioStats.totalCost.toLocaleString()}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">未實現損益</p>
              <p className={`text-2xl font-bold ${portfolioStats.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioStats.totalUnrealizedPnL >= 0 ? '+' : ''}HK${portfolioStats.totalUnrealizedPnL.toLocaleString()}
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
                {realizedPnLStats.totalRealizedPnL >= 0 ? '+' : ''}HK${realizedPnLStats.totalRealizedPnL.toLocaleString()}
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
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">持股明細</h2>
        
        {holdings.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-lg mb-2">📈</div>
            <div className="text-gray-500 mb-4">尚無港股持股</div>
            <div className="text-sm text-gray-400">
              交易記錄數量: {transactions.length}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2">股票代碼</th>
                  <th className="text-left p-2">公司名稱</th>
                  <th className="text-right p-2">持股數量</th>
                  <th className="text-right p-2">平均成本</th>
                  <th className="text-right p-2">當前價格</th>
                  <th className="text-right p-2">未實現損益</th>
                  <th className="text-right p-2">報酬率</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => {
                  const currentPrice = stockPrices[holding.symbol]?.currentPrice || holding.avgCost;
                  const unrealizedPnL = (currentPrice - holding.avgCost) * holding.totalQuantity;
                  const returnRate = ((currentPrice - holding.avgCost) / holding.avgCost) * 100;
                  
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-semibold">{holding.symbol}</td>
                      <td className="p-2">{holding.stockName}</td>
                      <td className="p-2 text-right">{holding.totalQuantity.toLocaleString()}</td>
                      <td className="p-2 text-right">HK${holding.avgCost.toFixed(2)}</td>
                      <td className="p-2 text-right">
                        {editingPrice === holding.symbol ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(e.target.value)}
                              className="w-20 px-2 py-1 border rounded text-sm"
                              placeholder="價格"
                              step="0.01"
                            />
                            <button
                              onClick={() => updateManualPrice(holding.symbol, newPrice)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                            >
                              確認
                            </button>
                            <button
                              onClick={() => {
                                setEditingPrice(null);
                                setNewPrice('');
                              }}
                              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <div 
                            className="cursor-pointer hover:bg-blue-50 p-1 rounded"
                            onClick={() => {
                              setEditingPrice(holding.symbol);
                              setNewPrice(currentPrice.toString());
                            }}
                          >
                            <div className="font-semibold">HK${currentPrice.toFixed(2)}</div>
                            {stockPrices[holding.symbol]?.lastUpdated && (
                              <div className="text-xs text-gray-500">
                                {stockPrices[holding.symbol].lastUpdated}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={`p-2 text-right ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {unrealizedPnL >= 0 ? '+' : ''}HK${unrealizedPnL.toLocaleString()}
                      </td>
                      <td className={`p-2 text-right ${returnRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
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
            尚無港股交易記錄
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
                  {tx.quantity} 股 @ HK${tx.price} = HK${(tx.quantity * tx.price).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">{tx.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HKMarket;

