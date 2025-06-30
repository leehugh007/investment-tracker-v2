import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StockPriceUpdater from '../components/StockPriceUpdater';

function TWMarket() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [stockPrices, setStockPrices] = useState({});

  useEffect(() => {
    // 載入台股交易記錄
    const allTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const twTransactions = allTransactions.filter(t => t.market === 'TW');
    setTransactions(twTransactions);
  }, []);

  const handlePricesUpdated = (priceResults, market) => {
    if (market === 'TW') {
      const newPrices = {};
      priceResults.forEach(result => {
        newPrices[result.symbol] = result;
      });
      setStockPrices(prev => ({ ...prev, ...newPrices }));
    }
  };

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
        
        <div className="text-center py-8">
          <div className="text-gray-400 text-lg mb-2">📈</div>
          <div className="text-gray-500 mb-4">台股頁面已成功載入</div>
          <div className="text-sm text-gray-400">
            交易記錄數量: {transactions.length}
          </div>
        </div>
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
    </div>
  );
}

export default TWMarket;

