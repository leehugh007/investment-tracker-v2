import React, { useState } from 'react';
import BackupManager from '../components/BackupManager';
import { userSettingsService } from '../hooks/useLocalStore';

const Settings = () => {
  const [settings, setSettings] = useState(userSettingsService.getAll());
  const [message, setMessage] = useState(null);

  // 顯示消息
  const showMessage = (msg, type = 'info') => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // 更新設定
  const updateSetting = (key, value) => {
    const success = userSettingsService.update(key, value);
    if (success) {
      setSettings(prev => ({ ...prev, [key]: value }));
      showMessage('設定已保存', 'success');
    } else {
      showMessage('設定保存失敗', 'error');
    }
  };

  // 處理數據變更（備份管理觸發）
  const handleDataChange = () => {
    // 重新載入設定
    setSettings(userSettingsService.getAll());
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">⚙️ 系統設定</h1>
          <p className="text-gray-600">管理您的投資追蹤系統偏好設定和數據備份</p>
        </div>

        {/* 消息顯示 */}
        {message && (
          <div className={`mb-6 p-3 rounded-lg ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-8">
          {/* 一般設定 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">🎛️ 一般設定</h2>
            
            <div className="space-y-6">
              {/* 主要貨幣 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  主要貨幣
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">美元 (USD)</option>
                  <option value="TWD">新台幣 (TWD)</option>
                  <option value="HKD">港幣 (HKD)</option>
                  <option value="JPY">日圓 (JPY)</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  用於總覽頁面的統一貨幣顯示
                </p>
              </div>

              {/* 主題設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  介面主題
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="light"
                      checked={settings.theme === 'light'}
                      onChange={(e) => updateSetting('theme', e.target.value)}
                      className="mr-2"
                    />
                    <span>淺色主題</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="dark"
                      checked={settings.theme === 'dark'}
                      onChange={(e) => updateSetting('theme', e.target.value)}
                      className="mr-2"
                    />
                    <span>深色主題</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="auto"
                      checked={settings.theme === 'auto'}
                      onChange={(e) => updateSetting('theme', e.target.value)}
                      className="mr-2"
                    />
                    <span>跟隨系統</span>
                  </label>
                </div>
              </div>

              {/* 語言設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  介面語言
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => updateSetting('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="zh-TW">繁體中文</option>
                  <option value="zh-CN">简体中文</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">日本語</option>
                </select>
              </div>

              {/* 通知設定 */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => updateSetting('notifications', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    啟用系統通知
                  </span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  接收股價更新和重要系統消息
                </p>
              </div>
            </div>
          </div>

          {/* 數據管理 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">💾 數據管理</h2>
            
            <div className="space-y-6">
              {/* 自動保存設定 */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.autoSave !== false}
                    onChange={(e) => updateSetting('autoSave', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    自動保存交易記錄
                  </span>
                </label>
                <p className="mt-1 text-sm text-gray-500">
                  在新增或修改交易時自動保存到本地存儲
                </p>
              </div>

              {/* 數據保留期限 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  股價數據保留期限
                </label>
                <select
                  value={settings.dataRetentionDays || 30}
                  onChange={(e) => updateSetting('dataRetentionDays', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={7}>7 天</option>
                  <option value={30}>30 天</option>
                  <option value={90}>90 天</option>
                  <option value={365}>1 年</option>
                  <option value={-1}>永久保留</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  自動清理過期的股價緩存數據
                </p>
              </div>
            </div>
          </div>

          {/* 備份管理 */}
          <BackupManager onDataChange={handleDataChange} />

          {/* 關於信息 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">ℹ️ 關於系統</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">系統版本：</span>
                <span className="font-medium">v2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">最後更新：</span>
                <span className="font-medium">2025-06-29</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">數據存儲：</span>
                <span className="font-medium">本地瀏覽器存儲</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">支援市場：</span>
                <span className="font-medium">美股、台股、港股、日股</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">📝 使用說明</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• 所有數據存儲在您的瀏覽器本地，不會上傳到服務器</li>
                <li>• 建議定期使用備份功能保存您的投資數據</li>
                <li>• 清除瀏覽器數據會導致投資記錄丟失</li>
                <li>• 如需在多設備間同步，請使用匯出/匯入功能</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

