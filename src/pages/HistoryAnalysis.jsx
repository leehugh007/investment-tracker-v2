import { useState, useEffect, useMemo } from 'react';

// 計算已實現損益的函數
const calculateRealizedPnL = (transactions) => {
  let totalRealizedPnL = 0;
  
  // 按股票分組
  const stockGroups = {};
  transactions.forEach(tx => {
    if (!stockGroups[tx.symbol]) {
      stockGroups[tx.symbol] = [];
    }
    stockGroups[tx.symbol].push(tx);
  });
  
  // 對每個股票計算已實現損益
  Object.values(stockGroups).forEach(stockTxs => {
    // 按時間排序
    stockTxs.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const buyQueue = []; // FIFO 隊列存放買入記錄
    
    stockTxs.forEach(tx => {
      if (tx.type === 'BUY') {
        buyQueue.push({
          price: tx.price,
          quantity: tx.quantity,
          remainingQuantity: tx.quantity
        });
      } else if (tx.type === 'SELL') {
        let sellQuantity = tx.quantity;
        const sellPrice = tx.price;
        
        // 使用 FIFO 方法配對賣出
        while (sellQuantity > 0 && buyQueue.length > 0) {
          const buyRecord = buyQueue[0];
          const matchQuantity = Math.min(sellQuantity, buyRecord.remainingQuantity);
          
          // 計算這部分的已實現損益
          const pnl = (sellPrice - buyRecord.price) * matchQuantity;
          totalRealizedPnL += pnl;
          
          // 更新數量
          sellQuantity -= matchQuantity;
          buyRecord.remainingQuantity -= matchQuantity;
          
          // 如果買入記錄用完了，移除它
          if (buyRecord.remainingQuantity === 0) {
            buyQueue.shift();
          }
        }
      }
    });
  });
  
  return totalRealizedPnL;
};

const HistoryAnalysis = () => {
  const [transactions, setTransactions] = useState([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    market: 'all',
    type: 'all',
    symbol: ''
  });

  // 載入交易記錄
  useEffect(() => {
    const loadTransactions = () => {
      try {
        const stored = localStorage.getItem('transactions');
        if (stored) {
          setTransactions(JSON.parse(stored));
        }
      } catch (error) {
        console.error('載入交易記錄失敗:', error);
      }
    };

    loadTransactions();
  }, []);

  // 篩選交易記錄
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // 時間篩選
      if (filters.startDate && tx.date < filters.startDate) return false;
      if (filters.endDate && tx.date > filters.endDate) return false;
      
      // 市場篩選
      if (filters.market !== 'all' && tx.market !== filters.market) return false;
      
      // 交易類型篩選
      if (filters.type !== 'all' && tx.type !== filters.type) return false;
      
      // 股票代號篩選
      if (filters.symbol && !tx.symbol.toLowerCase().includes(filters.symbol.toLowerCase())) return false;
      
      return true;
    });
  }, [transactions, filters]);

  // 計算統計指標
  const statistics = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return {
        totalTransactions: 0,
        totalBuyAmount: 0,
        totalSellAmount: 0,
        realizedPnL: 0,
        winRate: 0,
        avgPnLPerTrade: 0
      };
    }

    const buyTransactions = filteredTransactions.filter(tx => tx.type === 'BUY');
    const sellTransactions = filteredTransactions.filter(tx => tx.type === 'SELL');
    
    const totalBuyAmount = buyTransactions.reduce((sum, tx) => sum + (tx.quantity * tx.price), 0);
    const totalSellAmount = sellTransactions.reduce((sum, tx) => sum + (tx.quantity * tx.price), 0);
    
    // 正確的已實現損益計算
    const realizedPnL = calculateRealizedPnL(filteredTransactions);
    
    // 勝率計算（基於實際損益）
    const profitableTrades = sellTransactions.filter(tx => {
      // 這裡需要更複雜的邏輯來計算每筆賣出的實際損益
      // 暫時使用簡化版本
      const buyPrice = buyTransactions.find(buy => buy.symbol === tx.symbol)?.price || tx.price;
      return tx.price > buyPrice;
    }).length;
    
    const winRate = sellTransactions.length > 0 ? (profitableTrades / sellTransactions.length) * 100 : 0;
    
    const avgPnLPerTrade = sellTransactions.length > 0 ? realizedPnL / sellTransactions.length : 0;

    return {
      totalTransactions: filteredTransactions.length,
      totalBuyAmount,
      totalSellAmount,
      realizedPnL,
      winRate,
      avgPnLPerTrade
    };
  }, [filteredTransactions]);

  const marketNames = {
    'US': '美股',
    'TW': '台股',
    'HK': '港股',
    'JP': '日股'
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      market: 'all',
      type: 'all',
      symbol: ''
    });
  };

  const exportData = () => {
    const dataToExport = {
      filters,
      statistics,
      transactions: filteredTransactions
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📈 歷史分析</h1>
        <p className="text-gray-600">深入分析您的投資歷史記錄和績效表現</p>
      </div>

      {/* 篩選器 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">🔍 篩選條件</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">開始日期</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">結束日期</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">市場</label>
            <select
              value={filters.market}
              onChange={(e) => handleFilterChange('market', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部市場</option>
              <option value="US">🇺🇸 美股</option>
              <option value="TW">🇹🇼 台股</option>
              <option value="HK">🇭🇰 港股</option>
              <option value="JP">🇯🇵 日股</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">交易類型</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">全部類型</option>
              <option value="BUY">買入</option>
              <option value="SELL">賣出</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">股票代號</label>
            <input
              type="text"
              value={filters.symbol}
              onChange={(e) => handleFilterChange('symbol', e.target.value)}
              placeholder="例如: AAPL, 2330"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              重置篩選
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            顯示 {filteredTransactions.length} 筆交易記錄（共 {transactions.length} 筆）
          </p>
          <button
            onClick={exportData}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            📊 匯出分析數據
          </button>
        </div>
      </div>

      {/* 統計指標 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">交易次數</h3>
          <p className="text-3xl font-bold text-blue-600">{statistics.totalTransactions}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">總買入金額</h3>
          <p className="text-3xl font-bold text-green-600">${statistics.totalBuyAmount.toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">總賣出金額</h3>
          <p className="text-3xl font-bold text-red-600">${statistics.totalSellAmount.toFixed(2)}</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">已實現損益</h3>
          <p className={`text-3xl font-bold ${statistics.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {statistics.realizedPnL >= 0 ? '+' : ''}${statistics.realizedPnL.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 交易記錄表格 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold mb-4">📋 篩選後的交易記錄</h3>
        
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">沒有符合篩選條件的交易記錄</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日期</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">市場</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">股票代號</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">類型</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">數量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">價格</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">總金額</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((tx, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {marketNames[tx.market] || tx.market}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tx.type === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.type === 'BUY' ? '買入' : '賣出'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(tx.quantity * tx.price).toFixed(2)}
                    </td>
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

export default HistoryAnalysis;

