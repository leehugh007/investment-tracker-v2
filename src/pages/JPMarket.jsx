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
        const totalRealizedJPY = realizedPnL.reduce((sum, item) => sum + (item.realizedPnL || 0), 0);
        
        // 計算已實現投資成本（用於計算已實現報酬率）
        const realizedCost = realizedPnL.reduce((sum, item) => {
          return sum + (item.quantity * item.avgCost);
        }, 0);
        
        const realizedReturnRate = realizedCost > 0 ? (totalRealizedJPY / realizedCost * 100) : 0;

        setRealizedPnLStats({
          totalRealizedPnL: totalRealizedJPY,
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
    const jpTransactions = allTransactions.filter(t => t.market === 'JP');
    setTransactions(jpTransactions);
    calculateHoldings(jpTransactions);
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
          avgCost: 0,
          currentPrice: transaction.price, // 使用最後交易價格作為當前價格
          market: 'JP',
          currency: 'JPY'
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

  // 計算投資組合統計
  const calculatePortfolioStats = (holdings) => {
    let totalValue = 0;
    let totalCost = 0;
    let totalUnrealizedPnL = 0;

    holdings.forEach(holding => {
      const currentPrice = holding.currentPrice || 0;
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

  const updateManualPrice = (symbol, newPrice) => {
    setHoldings(prev => prev.map(holding => 
      holding.symbol === symbol 
        ? { ...holding, currentPrice: newPrice, lastUpdated: new Date().toLocaleString() }
        : holding
    ));
  };

  const calculateUnrealizedPnL = (holding) => {
    const unrealizedPnL = (holding.currentPrice - holding.avgCost) * holding.totalQuantity;
    const returnRate = ((holding.currentPrice - holding.avgCost) / holding.avgCost) * 100;
    return { unrealizedPnL, returnRate };
  };
  const portfolioStats = calculatePortfolioStats(holdings);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🇯🇵 日股投資組合
        </h1>
        <p className="text-gray-600">手動更新價格功能</p>
      </div>

      {/* 投資組合統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總市值</p>
                <p className="text-2xl font-bold">
                  ¥{portfolioStats.totalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">總成本</p>
                <p className="text-2xl font-bold">
                  ¥{portfolioStats.totalCost.toLocaleString()}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
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
                  ¥{portfolioStats.totalUnrealizedPnL.toLocaleString()}
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
                <p className={`text-2xl font-bold ${
                  portfolioStats.totalReturnRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {portfolioStats.totalReturnRate >= 0 ? '+' : ''}
                  {portfolioStats.totalReturnRate.toFixed(2)}%
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

      {/* 新增交易按鈕 */}
      <div className="mb-6">
        <Link 
          to="/add-transaction/jp"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
        >
          ➕新增交易
        </Link>
      </div>

      {/* 持股明細 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">持股明細</h2>
        
        {holdings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">📈</p>
            <p className="text-gray-500 mt-2">日股頁面已成功載入</p>
            <p className="text-sm text-gray-400">交易記錄數量: {transactions.length}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">股票代碼</th>
                  <th className="text-left p-2">公司名稱</th>
                  <th className="text-left p-2">持股數量</th>
                  <th className="text-left p-2">平均成本</th>
                  <th className="text-left p-2">當前價格</th>
                  <th className="text-left p-2">未實現損益</th>
                  <th className="text-left p-2">報酬率</th>
                  <th className="text-left p-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => {
                  const { unrealizedPnL, returnRate } = calculateUnrealizedPnL(holding);
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono">{holding.symbol}</td>
                      <td className="p-2">{holding.stockName}</td>
                      <td className="p-2">{holding.totalQuantity.toLocaleString()}</td>
                      <td className="p-2">¥{holding.avgCost.toFixed(0)}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="1"
                          value={holding.currentPrice}
                          onChange={(e) => updateManualPrice(holding.symbol, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className={`p-2 ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ¥{unrealizedPnL.toFixed(0)}
                      </td>
                      <td className={`p-2 ${returnRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {returnRate >= 0 ? '+' : ''}{returnRate.toFixed(2)}%
                      </td>
                      <td className="p-2">
                        <button
                          onClick={() => updateManualPrice(holding.symbol, holding.currentPrice)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          更新
                        </button>
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
        <h2 className="text-xl font-semibold mb-4">交易記錄</h2>
        
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">尚無日股交易記錄</p>
        ) : (
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
                  <th className="text-left p-2">金額</th>
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
                    <td className="p-2">¥{(transaction.quantity * transaction.price).toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default JPMarket;

