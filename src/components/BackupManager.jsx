import React, { useState, useRef } from 'react';
import { 
  exportToFile, 
  importFromFile, 
  getBackupStats, 
  clearAllData,
  formatFileSize,
  formatDate 
} from '../utils/backup';

const BackupManager = ({ onDataChange }) => {
  const [stats, setStats] = useState(getBackupStats());
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const fileInputRef = useRef(null);

  // 更新統計信息
  const updateStats = () => {
    setStats(getBackupStats());
  };

  // 顯示消息
  const showMessage = (msg, type = 'info') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 5000);
  };

  // 匯出數據
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const result = exportToFile();
      if (result.success) {
        showMessage(result.message, 'success');
        updateStats();
      } else {
        showMessage(result.message, 'error');
      }
    } catch (error) {
      showMessage('匯出失敗：' + error.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 處理文件選擇
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImport(file);
    }
  };

  // 匯入數據
  const handleImport = async (file) => {
    setIsImporting(true);
    try {
      const result = await importFromFile(file);
      if (result.success) {
        showMessage(result.message, 'success');
        updateStats();
        
        // 通知父組件數據已更改
        if (onDataChange) {
          onDataChange();
        }
        
        // 延遲刷新頁面
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      showMessage('匯入失敗：' + error.message, 'error');
    } finally {
      setIsImporting(false);
      // 清空文件輸入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 清空所有數據
  const handleClearAll = () => {
    const result = clearAllData();
    if (result.success) {
      showMessage(result.message, 'success');
      updateStats();
      setShowClearConfirm(false);
      
      // 通知父組件數據已更改
      if (onDataChange) {
        onDataChange();
      }
      
      // 延遲刷新頁面
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      showMessage(result.message, 'error');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">📦 數據備份管理</h2>
      
      {/* 消息顯示 */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* 統計信息 */}
      {stats && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-3">📊 數據統計</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.transactions}</div>
              <div className="text-sm text-gray-600">交易記錄</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.stockPrices}</div>
              <div className="text-sm text-gray-600">股價記錄</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.exchangeRates}</div>
              <div className="text-sm text-gray-600">匯率記錄</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.userSettings}</div>
              <div className="text-sm text-gray-600">用戶設定</div>
            </div>
          </div>
          
          {/* 市場分布 */}
          {stats.marketBreakdown && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">市場分布：</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.marketBreakdown).map(([market, count]) => (
                  <span key={market} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                    {market}: {count}筆
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-sm text-gray-600">
            <div>數據大小: {formatFileSize(stats.totalSize)}</div>
            {stats.lastExport && (
              <div>上次匯出: {formatDate(stats.lastExport)}</div>
            )}
          </div>
        </div>
      )}

      {/* 操作按鈕 */}
      <div className="space-y-4">
        {/* 匯出數據 */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">匯出備份</h3>
            <p className="text-sm text-gray-600">將所有數據匯出為JSON文件</p>
          </div>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? '匯出中...' : '📤 匯出'}
          </button>
        </div>

        {/* 匯入數據 */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <h3 className="font-medium text-gray-900">匯入備份</h3>
            <p className="text-sm text-gray-600">從JSON文件恢復數據（會覆蓋現有數據）</p>
          </div>
          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isImporting ? '匯入中...' : '📥 選擇文件'}
            </button>
          </div>
        </div>

        {/* 清空數據 */}
        <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
          <div>
            <h3 className="font-medium text-red-900">清空所有數據</h3>
            <p className="text-sm text-red-600">⚠️ 危險操作：將刪除所有交易記錄和設定</p>
          </div>
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️ 清空數據
          </button>
        </div>
      </div>

      {/* 清空確認對話框 */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-bold text-red-900 mb-4">⚠️ 確認清空數據</h3>
            <p className="text-gray-700 mb-6">
              此操作將永久刪除所有交易記錄、股價數據、匯率數據和用戶設定。
              <br /><br />
              <strong>此操作無法撤銷！</strong>
              <br /><br />
              建議在清空前先匯出備份。
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                確認清空
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 使用說明 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">💡 使用說明</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>匯出備份</strong>：定期備份您的投資數據，防止數據丟失</li>
          <li>• <strong>匯入備份</strong>：從備份文件恢復數據，或在不同設備間同步</li>
          <li>• <strong>數據格式</strong>：備份文件為JSON格式，包含完整的投資記錄</li>
          <li>• <strong>安全提醒</strong>：備份文件包含您的投資數據，請妥善保管</li>
        </ul>
      </div>
    </div>
  );
};

export default BackupManager;

