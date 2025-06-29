import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import StockNameLookup from './StockNameLookup';
import { 
  validateSellTransaction, 
  createEnhancedTransaction,
  calculateHoldings,
  processSellTransaction
} from '../utils/holdingsCalculator';
import { transactionService } from '../hooks/useLocalStore';

const TransactionForm = ({ market }) => {
  const navigate = useNavigate();
  const [stockInfo, setStockInfo] = useState(null);
  const [holdings, setHoldings] = useState(null);
  const [sellValidation, setSellValidation] = useState(null);

  const marketConfig = {
    US: { currency: 'USD', placeholder: 'AAPL', name: '🇺🇸 美股' },
    TW: { currency: 'TWD', placeholder: '2330', name: '🇹🇼 台股' },
    HK: { currency: 'HKD', placeholder: '0700', name: '🇭🇰 港股' },
    JP: { currency: 'JPY', placeholder: '7203', name: '🇯🇵 日股' }
  };

  const config = marketConfig[market] || marketConfig.US;

  // React Hook Form 設置
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      symbol: '',
      type: 'BUY',
      quantity: '',
      price: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  // 監聽表單變化
  const watchedSymbol = watch('symbol');
  const watchedType = watch('type');
  const watchedQuantity = watch('quantity');

  // 檢查持股狀況（當股票代碼或交易類型改變時）
  useEffect(() => {
    if (watchedSymbol && watchedType === 'SELL') {
      // 使用新的服務層獲取交易記錄
      const existingTransactions = transactionService.getAll();
      const currentHoldings = calculateHoldings(watchedSymbol.toUpperCase(), existingTransactions);
      setHoldings(currentHoldings);
      
      // 如果有輸入數量，立即驗證
      if (watchedQuantity) {
        const validation = validateSellTransaction(
          watchedSymbol.toUpperCase(), 
          parseInt(watchedQuantity), 
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
  }, [watchedSymbol, watchedType, watchedQuantity]);

  // 表單提交處理
  const onSubmit = async (data) => {
    try {
      // 使用新的服務層獲取現有交易
      const existingTransactions = transactionService.getAll();
      
      // 準備交易資料
      const transactionData = {
        symbol: data.symbol.toUpperCase(),
        stockName: stockInfo?.name || data.symbol.toUpperCase(),
        market,
        type: data.type,
        quantity: parseInt(data.quantity),
        price: parseFloat(data.price),
        date: data.date,
        currency: config.currency
      };

      // 如果是賣出交易，需要先處理FIFO配對
      if (data.type === 'SELL') {
        const sellResult = processSellTransaction(
          data.symbol.toUpperCase(),
          parseInt(data.quantity),
          existingTransactions
        );
        
        if (!sellResult.success) {
          throw new Error(sellResult.error);
        }
        
        // 批量更新交易記錄（包含FIFO配對的更新）
        const success = transactionService.updateBatch(sellResult.updatedTransactions);
        if (!success) {
          throw new Error('更新交易記錄失敗');
        }
        
        // 創建並添加賣出交易
        const enhancedTransaction = createEnhancedTransaction(transactionData, sellResult.updatedTransactions);
        const newTransaction = transactionService.add(enhancedTransaction);
        
        if (!newTransaction) {
          throw new Error('保存賣出交易失敗');
        }
      } else {
        // 買入交易直接添加
        const enhancedTransaction = createEnhancedTransaction(transactionData, existingTransactions);
        const newTransaction = transactionService.add(enhancedTransaction);
        
        if (!newTransaction) {
          throw new Error('保存買入交易失敗');
        }
      }

      // 重置表單
      reset();
      setStockInfo(null);
      setHoldings(null);
      setSellValidation(null);

      alert(`${config.name}交易記錄已成功新增！`);
      
    } catch (error) {
      console.error('交易提交失敗:', error);
      alert(`提交失敗: ${error.message}`);
    }
  };

  // 自定義驗證規則
  const validationRules = {
    symbol: {
      required: '請輸入股票代碼',
      pattern: {
        value: /^[A-Za-z0-9]+$/,
        message: '股票代碼只能包含字母和數字'
      }
    },
    quantity: {
      required: '請輸入數量',
      min: {
        value: 1,
        message: '數量必須大於0'
      },
      validate: (value) => {
        if (watchedType === 'SELL' && holdings && !holdings.canSell) {
          return `您目前沒有持有 ${watchedSymbol.toUpperCase()} 股票`;
        }
        if (watchedType === 'SELL' && holdings && parseInt(value) > holdings.totalQuantity) {
          return `賣出數量 (${value}) 超過持有數量 (${holdings.totalQuantity})`;
        }
        return true;
      }
    },
    price: {
      required: '請輸入價格',
      min: {
        value: 0.01,
        message: '價格必須大於0'
      }
    },
    date: {
      required: '請選擇交易日期'
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                {...register('symbol', validationRules.symbol)}
                placeholder={`例如: ${config.placeholder}`}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.symbol ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.symbol && (
                <p className="mt-1 text-sm text-red-600">{errors.symbol.message}</p>
              )}
              
              {/* 股票名稱自動顯示 */}
              <StockNameLookup 
                symbol={watchedSymbol}
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
                    value="BUY"
                    {...register('type')}
                    className="mr-2"
                  />
                  <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                    買入
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="SELL"
                    {...register('type')}
                    className="mr-2"
                  />
                  <span className="px-3 py-2 bg-red-100 text-red-800 rounded-lg font-medium">
                    賣出
                  </span>
                </label>
              </div>
            </div>

            {/* 持股資訊顯示（僅賣出時） */}
            {watchedType === 'SELL' && watchedSymbol && (
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
                      ❌ 您目前沒有持有 {watchedSymbol.toUpperCase()} 股票
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
                  {...register('quantity', validationRules.quantity)}
                  placeholder="100"
                  min="1"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.quantity ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  價格 ({config.currency}) *
                </label>
                <input
                  type="number"
                  {...register('price', validationRules.price)}
                  placeholder={market === 'US' ? '150.50' : '600'}
                  step="0.01"
                  min="0.01"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
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
                {...register('date', validationRules.date)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
              )}
            </div>

            {/* 交易摘要 */}
            {watchedSymbol && watch('quantity') && watch('price') && (
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
                      {watchedSymbol.toUpperCase()}
                      {stockInfo && (
                        <span className="text-gray-600 ml-1">
                          - {stockInfo.name}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>動作:</span>
                    <span className={watchedType === 'BUY' ? 'text-green-600' : 'text-red-600'}>
                      {watchedType === 'BUY' ? '買入' : '賣出'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>總金額:</span>
                    <span className="font-medium">
                      {(watch('quantity') * watch('price')).toLocaleString()} {config.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 提交按鈕 */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '處理中...' : `新增${config.name}交易記錄`}
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

