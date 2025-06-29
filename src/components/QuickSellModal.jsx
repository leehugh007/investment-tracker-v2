import React, { useState } from 'react';
import { validateSellTransaction, createEnhancedTransaction } from '../utils/holdingsCalculator';

function QuickSellModal({ isOpen, onClose, holding, onSellComplete }) {
  const [sellQuantity, setSellQuantity] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellDate, setSellDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const quantity = parseInt(sellQuantity);
      const price = parseFloat(sellPrice);

      // 驗證輸入
      if (!quantity || quantity <= 0) {
        throw new Error('請輸入有效的賣出數量');
      }
      if (!price || price <= 0) {
        throw new Error('請輸入有效的賣出價格');
      }
      if (quantity > holding.totalQuantity) {
        throw new Error(`賣出數量不能超過持股數量 ${holding.totalQuantity}`);
      }

      // 獲取現有交易記錄
      const existingTransactions = JSON.parse(localStorage.getItem('transactions') || '[]');

      // 驗證賣出交易
      const validation = validateSellTransaction(
        holding.symbol,
        quantity,
        existingTransactions
      );

      if (!validation.isValid) {
        throw new Error(validation.message);
      }

      // 創建賣出交易
      const sellTransaction = createEnhancedTransaction({
        symbol: holding.symbol,
        stockName: holding.stockName,
        type: 'SELL',
        quantity: quantity,
        price: price,
        date: sellDate,
        market: 'US'
      }, existingTransactions);

      // 保存交易
      const updatedTransactions = [...existingTransactions, sellTransaction];
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

      // 通知父組件
      onSellComplete();
      
      // 重置表單並關閉彈窗
      setSellQuantity('');
      setSellPrice('');
      setSellDate(new Date().toISOString().split('T')[0]);
      onClose();

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            賣出 {holding?.symbol}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600">當前持股</div>
          <div className="font-medium">{holding?.totalQuantity} 股</div>
          <div className="text-sm text-gray-600">平均成本: ${holding?.avgCost?.toFixed(2)}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              賣出數量 *
            </label>
            <input
              type="number"
              value={sellQuantity}
              onChange={(e) => setSellQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={`最多 ${holding?.totalQuantity} 股`}
              max={holding?.totalQuantity}
              min="1"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              賣出價格 (USD) *
            </label>
            <input
              type="number"
              step="0.01"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="150.50"
              min="0.01"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              交易日期 *
            </label>
            <input
              type="date"
              value={sellDate}
              onChange={(e) => setSellDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-red-600 text-sm">{error}</div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? '處理中...' : '確認賣出'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickSellModal;

