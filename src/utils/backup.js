/**
 * JSON 備份和恢復功能
 * 實現數據的匯出和匯入
 */

import { backupService } from '../hooks/useLocalStore';

/**
 * 將數據匯出為JSON文件
 */
export const exportToFile = () => {
  try {
    // 獲取所有數據
    const data = backupService.exportAll();
    
    // 創建文件名（包含時間戳）
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `investment-tracker-backup-${timestamp}.json`;
    
    // 創建Blob對象
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // 創建下載鏈接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // 觸發下載
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 清理URL對象
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      filename,
      message: `備份文件 ${filename} 已成功下載`
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error.message,
      message: '匯出失敗，請稍後再試'
    };
  }
};

/**
 * 從JSON文件匯入數據
 */
export const importFromFile = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('請選擇要匯入的文件'));
      return;
    }
    
    // 檢查文件類型
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      reject(new Error('請選擇JSON格式的備份文件'));
      return;
    }
    
    // 檢查文件大小（限制10MB）
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('文件大小超過限制（10MB）'));
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const jsonString = event.target.result;
        const data = JSON.parse(jsonString);
        
        // 驗證數據格式
        const validation = validateBackupData(data);
        if (!validation.isValid) {
          reject(new Error(`備份文件格式錯誤: ${validation.error}`));
          return;
        }
        
        // 匯入數據
        const success = backupService.importAll(data);
        if (success) {
          resolve({
            success: true,
            data,
            message: '數據匯入成功！頁面將自動刷新。'
          });
        } else {
          reject(new Error('數據匯入失敗，請檢查文件格式'));
        }
      } catch (error) {
        console.error('Import error:', error);
        reject(new Error(`文件解析失敗: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件讀取失敗'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * 驗證備份數據格式
 */
const validateBackupData = (data) => {
  try {
    // 檢查基本結構
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: '數據格式無效' };
    }
    
    // 檢查版本信息
    if (!data.version) {
      return { isValid: false, error: '缺少版本信息' };
    }
    
    // 檢查匯出日期
    if (!data.exportDate) {
      return { isValid: false, error: '缺少匯出日期' };
    }
    
    // 檢查交易記錄格式
    if (data.transactions && !Array.isArray(data.transactions)) {
      return { isValid: false, error: '交易記錄格式錯誤' };
    }
    
    // 檢查股價數據格式
    if (data.stockPrices && typeof data.stockPrices !== 'object') {
      return { isValid: false, error: '股價數據格式錯誤' };
    }
    
    // 檢查匯率數據格式
    if (data.exchangeRates && typeof data.exchangeRates !== 'object') {
      return { isValid: false, error: '匯率數據格式錯誤' };
    }
    
    // 檢查用戶設定格式
    if (data.userSettings && typeof data.userSettings !== 'object') {
      return { isValid: false, error: '用戶設定格式錯誤' };
    }
    
    // 驗證交易記錄的必要欄位
    if (data.transactions) {
      for (let i = 0; i < data.transactions.length; i++) {
        const tx = data.transactions[i];
        if (!tx.symbol || !tx.type || !tx.quantity || !tx.price || !tx.date) {
          return { 
            isValid: false, 
            error: `交易記錄 ${i + 1} 缺少必要欄位` 
          };
        }
        
        if (!['BUY', 'SELL'].includes(tx.type)) {
          return { 
            isValid: false, 
            error: `交易記錄 ${i + 1} 的交易類型無效` 
          };
        }
      }
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: error.message };
  }
};

/**
 * 獲取備份統計信息
 */
export const getBackupStats = () => {
  try {
    const data = backupService.exportAll();
    
    const stats = {
      transactions: data.transactions ? data.transactions.length : 0,
      stockPrices: data.stockPrices ? Object.keys(data.stockPrices).length : 0,
      exchangeRates: data.exchangeRates ? Object.keys(data.exchangeRates).length : 0,
      userSettings: data.userSettings ? Object.keys(data.userSettings).length : 0,
      totalSize: JSON.stringify(data).length,
      lastExport: data.exportDate || null
    };
    
    // 計算各市場的交易數量
    if (data.transactions) {
      stats.marketBreakdown = data.transactions.reduce((acc, tx) => {
        acc[tx.market] = (acc[tx.market] || 0) + 1;
        return acc;
      }, {});
    }
    
    return stats;
  } catch (error) {
    console.error('Get backup stats error:', error);
    return null;
  }
};

/**
 * 清空所有數據（危險操作）
 */
export const clearAllData = () => {
  try {
    const success = backupService.clearAll();
    if (success) {
      return {
        success: true,
        message: '所有數據已清空'
      };
    } else {
      return {
        success: false,
        message: '清空數據失敗'
      };
    }
  } catch (error) {
    console.error('Clear all data error:', error);
    return {
      success: false,
      error: error.message,
      message: '清空數據時發生錯誤'
    };
  }
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 格式化日期
 */
export const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return '無效日期';
  }
};

export default {
  exportToFile,
  importFromFile,
  getBackupStats,
  clearAllData,
  formatFileSize,
  formatDate
};

