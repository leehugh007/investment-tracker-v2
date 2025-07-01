import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const JPMarket = () => {
  const [transactions, setTransactions] = useState([]);
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    try {
      loadTransactions();
    } catch (error) {
      console.error('載入交易記錄時發生錯誤:', error);
    }
  }, []);

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
        <h1 className="text-2xl font-bold">🇯🇵 日股投資組合</h1>
        <Link 
          to="/add-transaction/jp"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
        >
          ➕新增交易
        </Link>
      </div>

      {/* 簡化的狀態顯示 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">頁面狀態</h2>
        <div className="space-y-2">
          <p>✅ 日股頁面已成功載入</p>
          <p>📊 交易記錄數量: {transactions.length}</p>
          <p>📈 持股數量: {holdings.length}</p>
          <p>💰 總市值: ¥{portfolioStats.totalValue.toLocaleString()}</p>
          <p>📊 總成本: ¥{portfolioStats.totalCost.toLocaleString()}</p>
          <p className={portfolioStats.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}>
            📈 未實現損益: {portfolioStats.totalUnrealizedPnL >= 0 ? '+' : ''}¥{portfolioStats.totalUnrealizedPnL.toLocaleString()}
          </p>
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
                </tr>
              </thead>
              <tbody>
                {holdings.map((holding, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-mono">{holding.symbol}</td>
                    <td className="p-2">{holding.stockName}</td>
                    <td className="p-2">{holding.totalQuantity.toLocaleString()}</td>
                    <td className="p-2">¥{holding.avgCost.toFixed(0)}</td>
                    <td className="p-2">¥{holding.currentPrice.toFixed(0)}</td>
                  </tr>
                ))}
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

