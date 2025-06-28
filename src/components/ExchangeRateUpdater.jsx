import { useState } from 'react';
import apiManager from '../services/apiManager';

const ExchangeRateUpdater = () => {
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const updateExchangeRates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const exchangeRates = await apiManager.getExchangeRates();
      setRates(exchangeRates);
      setLastUpdate(new Date().toLocaleString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const convertToTWD = (amount, currency) => {
    if (!rates) return amount;
    
    switch (currency) {
      case 'USD':
        return (amount * rates.USD_TWD).toFixed(2);
      case 'HKD':
        return (amount * rates.HKD_TWD).toFixed(2);
      case 'JPY':
        return (amount * rates.JPY_TWD).toFixed(2);
      case 'TWD':
        return amount.toFixed(2);
      default:
        return amount;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">💱 匯率轉換服務</h3>
        <button
          onClick={updateExchangeRates}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center space-x-2"
        >
          <span>🔄</span>
          <span>{loading ? '更新中...' : '更新匯率'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-600">❌ {error}</p>
        </div>
      )}

      {rates && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-green-600 font-semibold">✅ 匯率更新成功</p>
            <p className="text-sm text-green-600">最後更新: {lastUpdate}</p>
            <p className="text-xs text-green-500">API更新時間: {rates.lastUpdate}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded p-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🇺🇸</span>
                <div>
                  <p className="font-semibold">美元 → 台幣</p>
                  <p className="text-lg text-blue-600">1 USD = {rates.USD_TWD.toFixed(4)} TWD</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded p-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🇭🇰</span>
                <div>
                  <p className="font-semibold">港幣 → 台幣</p>
                  <p className="text-lg text-red-600">1 HKD = {rates.HKD_TWD.toFixed(4)} TWD</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 rounded p-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🇯🇵</span>
                <div>
                  <p className="font-semibold">日圓 → 台幣</p>
                  <p className="text-lg text-yellow-600">1 JPY = {rates.JPY_TWD.toFixed(4)} TWD</p>
                </div>
              </div>
            </div>
          </div>

          {/* 轉換示例 */}
          <div className="bg-gray-50 rounded p-4">
            <h4 className="font-semibold mb-3">💰 轉換示例</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-gray-600">美股損益</p>
                <p className="font-semibold">$1,000 USD</p>
                <p className="text-green-600">= NT${convertToTWD(1000, 'USD')}</p>
              </div>
              <div>
                <p className="text-gray-600">港股損益</p>
                <p className="font-semibold">$8,000 HKD</p>
                <p className="text-red-600">= NT${convertToTWD(8000, 'HKD')}</p>
              </div>
              <div>
                <p className="text-gray-600">日股損益</p>
                <p className="font-semibold">¥150,000 JPY</p>
                <p className="text-yellow-600">= NT${convertToTWD(150000, 'JPY')}</p>
              </div>
              <div>
                <p className="text-gray-600">總損益</p>
                <p className="font-semibold text-lg text-green-600">
                  NT${(
                    parseFloat(convertToTWD(1000, 'USD')) +
                    parseFloat(convertToTWD(8000, 'HKD')) +
                    parseFloat(convertToTWD(150000, 'JPY'))
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!rates && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">點擊「更新匯率」按鈕獲取最新匯率數據</p>
          <p className="text-sm text-gray-400">
            支援 USD、HKD、JPY 轉換為 TWD<br/>
            數據來源: ExchangeRate-API.com
          </p>
        </div>
      )}
    </div>
  );
};

export default ExchangeRateUpdater;

