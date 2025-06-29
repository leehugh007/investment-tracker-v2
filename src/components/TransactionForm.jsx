import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StockNameLookup from './StockNameLookup';
import { 
  validateSellTransaction, 
  createEnhancedTransaction,
  calculateHoldings 
} from '../utils/holdingsCalculator';

const TransactionForm = ({ market }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'BUY',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [stockInfo, setStockInfo] = useState(null);
  const [errors, setErrors] = useState({});
  const [holdings, setHoldings] = useState(null);
  const [sellValidation, setSellValidation] = useState(null);

  const marketConfig = {
    US: { currency: 'USD', placeholder: 'AAPL', name: '🇺🇸 美股' },
    TW: { currency: 'TWD', placeholder: '2330', name: '🇹🇼 台股' },
    HK: { currency: 'HKD', placeholder: '0700', name: '🇭🇰 港股' },
    JP: { currency: 'JPY', placeholder: '7203', name: '🇯🇵 日股' }
  };

  const config = marketConfig[market] || marketConfig.US;

  // 檢查持股狀況（當股票代碼或交易類型改變時）
  useEffect(() => {
    if (formData.symbol && formData.type === 'SELL') {
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const currentHoldings = calculateHoldings(formData.symbol.toUpperCase(), existingTransactions);
      setHoldings(currentHoldings);
      
      // 如果有輸入數量，立即驗證
      if (formData.quantity) {
        const validation = validateSellTransaction(
          formData.symbol.toUpperCase(), 
          parseInt(formData.quantity), 
          existingTransactions
        );
        setSellValidation(validation);
      } else {
        setSellValidation(null);
      }
    } else {
      setHoldings(null);
      setSellValidation(null);
    }
  }, [formData.symbol, formData.type, formData.quantity]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.symbol.trim()) {
      newErrors.symbol = '請輸入股票代碼';
    }

    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = '請輸入有效的數量';
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = '請輸入有效的價格';
    }

    if (!formData.date) {
      newErrors.date = '請選擇交易日期';
    }

    // 賣出交易的額外驗證
    if (formData.type === 'SELL') {
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      const validation = validateSellTransaction(
        formData.symbol.toUpperCase(),
        parseInt(formData.quantity),
        existingTransactions
      );
      
      if (!validation.isValid) {
        newErrors.quantity = validation.error;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // 獲取現有交易
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');
      
      // 準備交易資料
      const transactionData = {
        symbol: formData.symbol.toUpperCase(),
        stockName: stockInfo?.name || formData.symbol.toUpperCase(),
        market,
        type: formData.type,
        quantity: formData.quantity,
        price: formData.price,
        date: formData.date,
        currency: config.currency
      };

      // 使用增強的交易創建邏輯
      const enhancedTransaction = createEnhancedTransaction(transactionData, existingTransactions);
      
      // 如果是賣出交易，需要更新相關的買入交易
      let updatedTransactions;
      if (formData.type === 'SELL') {
        // createEnhancedTransaction 已經處理了配對邏輯，但我們需要獲取更新後的交易列表
        const { processSellTransaction } = await import('../utils/holdingsCalculator');
        const sellResult = processSellTransaction(
          formData.symbol.toUpperCase(),
          parseInt(formData.quantity),
          existingTransactions
        );
        
        if (!sellResult.success) {
          throw new Error(sellResult.error);
        }
        
        // 添加新的賣出交易到更新後的交易列表
        updatedTransactions = [...sellResult.updatedTransactions, enhancedTransaction];
      } else {
        // 買入交易直接添加
        updatedTransactions = [...existingTransactions, enhancedTransaction];
      }

      // 保存到localStorage
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

      // 重置表單
      setFormData({
        symbol: '',
        type: 'BUY',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
      });
      setStockInfo(null);
      setErrors({});
      setHoldings(null);
      setSellValidation(null);

      alert(`${config.name}交易記錄已成功新增！`);
      
    } catch (error) {
      console.error('交易提交失敗:', error);
      setErrors({ submit: error.message });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 清除對應的錯誤
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleStockInfoChange = (info) => {
    setStockInfo(info);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            ← 返回
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ➕ 新增{config.name}交易記錄
          </h1>
          <p className="text-gray-600">記錄您的買賣交易，系統將自動計算損益</p>
        </div>

        {/* 交易表單 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 市場顯示 */}
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  投資市場: {config.name} ({config.currency})
                </span>
                <span className="text-sm text-blue-600">
                  {market === 'US' || market === 'TW' ? 'API自動更新' : '手動輸入價格'}
                </span>
              </div>
            </div>

            {/* 股票代碼輸入 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                股票代碼 *
              </label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                placeholder={`例如: ${config.placeholder}`}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.symbol ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.symbol && (
                <p className="mt-1 text-sm text-red-600">{errors.symbol}</p>
              )}
              
              {/* 股票名稱自動顯示 - 按照架構文檔整合 */}
              <StockNameLookup 
                symbol={formData.symbol}
                market={market}
                onStockInfoChange={handleStockInfoChange}
                className="mt-2"
              />
            </div>

            {/* 交易類型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易類型 *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="BUY"
                    checked={formData.type === 'BUY'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                    買入
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="SELL"
                    checked={formData.type === 'SELL'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="px-3 py-2 bg-red-100 text-red-800 rounded-lg font-medium">
                    賣出
                  </span>
                </label>
              </div>
            </div>

            {/* 持股資訊顯示（僅賣出時） */}
            {formData.type === 'SELL' && formData.symbol && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">
                  📊 持股資訊
                </h3>
                {holdings ? (
                  holdings.canSell ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-yellow-700">目前持股:</span>
                        <span className="font-medium text-yellow-900">
                          {holdings.totalQuantity} 股
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-700">平均成本:</span>
                        <span className="font-medium text-yellow-900">
                          {holdings.averageCost} {config.currency}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-yellow-700">總成本:</span>
                        <span className="font-medium text-yellow-900">
                          {holdings.totalCost.toLocaleString()} {config.currency}
                        </span>
                      </div>
                      {sellValidation && !sellValidation.isValid && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                          ⚠️ {sellValidation.error}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      ❌ 您目前沒有持有 {formData.symbol.toUpperCase()} 股票
                    </div>
                  )
                ) : (
                  <div className="text-sm text-gray-600">
                    正在檢查持股狀況...
                  </div>
                )}
              </div>
            )}

            {/* 數量和價格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  數量 (股) *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="100"
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  價格 ({config.currency}) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder={market === 'US' ? '150.50' : '600'}
                  step="0.01"
                  min="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>
            </div>

            {/* 交易日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                交易日期 *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date}</p>
              )}
            </div>

            {/* 交易摘要 */}
            {formData.symbol && formData.quantity && formData.price && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">交易摘要</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>市場:</span>
                    <span>{config.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>股票:</span>
                    <span>
                      {formData.symbol.toUpperCase()}
                      {stockInfo && (
                        <span className="text-gray-600 ml-1">
                          - {stockInfo.name}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>動作:</span>
                    <span className={formData.type === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                      {formData.type === 'BUY' ? '買入' : '賣出'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>總金額:</span>
                    <span className="font-medium">
                      {(formData.quantity * formData.price).toLocaleString()} {config.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 提交錯誤顯示 */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">❌</span>
                  <span className="text-red-700 text-sm">{errors.submit}</span>
                </div>
              </div>
            )}

            {/* 提交按鈕 */}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                新增{config.name}交易記錄
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;

