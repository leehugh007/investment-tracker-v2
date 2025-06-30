import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StockPriceUpdater from '../components/StockPriceUpdater';

const HKMarket = () => {
  const [transactions, setTransactions] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [stockPrices, setStockPrices] = useState({});

  useEffect(() => {
    loadTransactions();
  }, []);

  const handlePricesUpdated = (priceResults, market) => {
    if (market === 'HK') {
      const newPrices = {};
      priceResults.forEach(result => {
        newPrices[result.symbol] = result;
      });
      setStockPrices(prev => ({ ...prev, ...newPrices }));
    }
  };

  const loadTransactions = () => {
    const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const hkTransactions = allTransactions.filter(t => t.market === 'HK');
    setTransactions(hkTransactions);
    calculateHoldings(hkTransactions);
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
          market: 'HK',
          currency: 'HKD'
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

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🇭🇰 港股投資組合
        </h1>
        <p className="text-gray-600">
          手動輸入價格
        </p>
        <p className="text-sm text-gray-500 mt-2">
          此頁面將在後續階段實現，包含持股明細、交易記錄和手動價格輸入功能
        </p>
      </div>

      {/* 新增交易按鈕 */}
      <div className="mb-6">
        <Link 
          to="/add-transaction/hk"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
        >
          ➕新增交易
        </Link>
      </div>

      {/* 股價更新組件 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <StockPriceUpdater
          transactions={transactions}
          onPricesUpdated={handlePricesUpdated}
          market="HK"
        />
      </div>

      {/* 持股明細 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">持股明細</h2>
        
        {holdings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">📈</p>
            <p className="text-gray-500 mt-2">港股頁面已成功載入</p>
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
                      <td className="p-2">HK${holding.avgCost.toFixed(2)}</td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={holding.currentPrice}
                          onChange={(e) => updateManualPrice(holding.symbol, parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border rounded text-sm"
                        />
                      </td>
                      <td className={`p-2 ${unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        HK${unrealizedPnL.toFixed(2)}
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
          <p className="text-gray-500 text-center py-4">尚無港股交易記錄</p>
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
                    <td className="p-2">HK${transaction.price.toFixed(2)}</td>
                    <td className="p-2">HK${(transaction.quantity * transaction.price).toFixed(2)}</td>
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

export default HKMarket;

