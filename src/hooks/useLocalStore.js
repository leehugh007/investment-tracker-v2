/**
 * localStorage 服務層
 * 統一管理所有本地數據存取操作
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'transactions',
  STOCK_PRICES: 'stockPrices',
  EXCHANGE_RATES: 'exchangeRates',
  USER_SETTINGS: 'userSettings'
};

/**
 * 安全的 localStorage 操作
 */
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('localStorage getItem error:', error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('localStorage setItem error:', error);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('localStorage removeItem error:', error);
      return false;
    }
  }
};

/**
 * 交易記錄相關操作
 */
export const transactionService = {
  // 獲取所有交易記錄
  getAll: () => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  },

  // 根據市場獲取交易記錄
  getByMarket: (market) => {
    const allTransactions = transactionService.getAll();
    return allTransactions.filter(tx => tx.market === market);
  },

  // 根據股票代碼獲取交易記錄
  getBySymbol: (symbol) => {
    const allTransactions = transactionService.getAll();
    return allTransactions.filter(tx => tx.symbol === symbol.toUpperCase());
  },

  // 添加新交易記錄
  add: (transaction) => {
    const transactions = transactionService.getAll();
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    
    transactions.push(newTransaction);
    const success = safeLocalStorage.setItem(
      STORAGE_KEYS.TRANSACTIONS, 
      JSON.stringify(transactions)
    );
    
    return success ? newTransaction : null;
  },

  // 更新交易記錄
  update: (id, updates) => {
    const transactions = transactionService.getAll();
    const index = transactions.findIndex(tx => tx.id === id);
    
    if (index === -1) return false;
    
    transactions[index] = { ...transactions[index], ...updates };
    return safeLocalStorage.setItem(
      STORAGE_KEYS.TRANSACTIONS, 
      JSON.stringify(transactions)
    );
  },

  // 批量更新交易記錄（用於FIFO配對）
  updateBatch: (updatedTransactions) => {
    return safeLocalStorage.setItem(
      STORAGE_KEYS.TRANSACTIONS, 
      JSON.stringify(updatedTransactions)
    );
  },

  // 刪除交易記錄
  delete: (id) => {
    const transactions = transactionService.getAll();
    const filteredTransactions = transactions.filter(tx => tx.id !== id);
    return safeLocalStorage.setItem(
      STORAGE_KEYS.TRANSACTIONS, 
      JSON.stringify(filteredTransactions)
    );
  },

  // 清空所有交易記錄
  clear: () => {
    return safeLocalStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
  }
};

/**
 * 股價數據相關操作
 */
export const stockPriceService = {
  // 獲取所有股價數據
  getAll: () => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.STOCK_PRICES);
    return data ? JSON.parse(data) : {};
  },

  // 獲取特定股票的價格
  getBySymbol: (symbol) => {
    const allPrices = stockPriceService.getAll();
    return allPrices[symbol.toUpperCase()] || null;
  },

  // 更新股價數據
  update: (symbol, priceData) => {
    const allPrices = stockPriceService.getAll();
    allPrices[symbol.toUpperCase()] = {
      ...priceData,
      lastUpdated: new Date().toISOString()
    };
    
    return safeLocalStorage.setItem(
      STORAGE_KEYS.STOCK_PRICES, 
      JSON.stringify(allPrices)
    );
  },

  // 批量更新股價數據
  updateBatch: (priceUpdates) => {
    const allPrices = stockPriceService.getAll();
    const timestamp = new Date().toISOString();
    
    Object.entries(priceUpdates).forEach(([symbol, priceData]) => {
      allPrices[symbol.toUpperCase()] = {
        ...priceData,
        lastUpdated: timestamp
      };
    });
    
    return safeLocalStorage.setItem(
      STORAGE_KEYS.STOCK_PRICES, 
      JSON.stringify(allPrices)
    );
  },

  // 清除過期的股價數據
  clearExpired: (maxAgeHours = 24) => {
    const allPrices = stockPriceService.getAll();
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    const validPrices = {};
    Object.entries(allPrices).forEach(([symbol, priceData]) => {
      if (priceData.lastUpdated && new Date(priceData.lastUpdated) > cutoffTime) {
        validPrices[symbol] = priceData;
      }
    });
    
    return safeLocalStorage.setItem(
      STORAGE_KEYS.STOCK_PRICES, 
      JSON.stringify(validPrices)
    );
  }
};

/**
 * 匯率數據相關操作
 */
export const exchangeRateService = {
  // 獲取所有匯率數據
  getAll: () => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.EXCHANGE_RATES);
    return data ? JSON.parse(data) : {};
  },

  // 獲取特定貨幣對的匯率
  getRate: (fromCurrency, toCurrency) => {
    const allRates = exchangeRateService.getAll();
    const key = `${fromCurrency}_${toCurrency}`;
    return allRates[key] || null;
  },

  // 更新匯率數據
  updateRate: (fromCurrency, toCurrency, rate) => {
    const allRates = exchangeRateService.getAll();
    const key = `${fromCurrency}_${toCurrency}`;
    
    allRates[key] = {
      rate,
      lastUpdated: new Date().toISOString()
    };
    
    return safeLocalStorage.setItem(
      STORAGE_KEYS.EXCHANGE_RATES, 
      JSON.stringify(allRates)
    );
  }
};

/**
 * 用戶設定相關操作
 */
export const userSettingsService = {
  // 獲取所有用戶設定
  getAll: () => {
    const data = safeLocalStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    return data ? JSON.parse(data) : {
      theme: 'light',
      currency: 'USD',
      language: 'zh-TW',
      notifications: true
    };
  },

  // 獲取特定設定
  get: (key) => {
    const settings = userSettingsService.getAll();
    return settings[key];
  },

  // 更新設定
  update: (key, value) => {
    const settings = userSettingsService.getAll();
    settings[key] = value;
    
    return safeLocalStorage.setItem(
      STORAGE_KEYS.USER_SETTINGS, 
      JSON.stringify(settings)
    );
  },

  // 批量更新設定
  updateBatch: (updates) => {
    const settings = userSettingsService.getAll();
    Object.assign(settings, updates);
    
    return safeLocalStorage.setItem(
      STORAGE_KEYS.USER_SETTINGS, 
      JSON.stringify(settings)
    );
  }
};

/**
 * 數據備份和恢復
 */
export const backupService = {
  // 導出所有數據
  exportAll: () => {
    const data = {
      transactions: transactionService.getAll(),
      stockPrices: stockPriceService.getAll(),
      exchangeRates: exchangeRateService.getAll(),
      userSettings: userSettingsService.getAll(),
      exportDate: new Date().toISOString(),
      version: '2.0'
    };
    
    return data;
  },

  // 導入數據
  importAll: (data) => {
    try {
      if (data.transactions) {
        safeLocalStorage.setItem(
          STORAGE_KEYS.TRANSACTIONS, 
          JSON.stringify(data.transactions)
        );
      }
      
      if (data.stockPrices) {
        safeLocalStorage.setItem(
          STORAGE_KEYS.STOCK_PRICES, 
          JSON.stringify(data.stockPrices)
        );
      }
      
      if (data.exchangeRates) {
        safeLocalStorage.setItem(
          STORAGE_KEYS.EXCHANGE_RATES, 
          JSON.stringify(data.exchangeRates)
        );
      }
      
      if (data.userSettings) {
        safeLocalStorage.setItem(
          STORAGE_KEYS.USER_SETTINGS, 
          JSON.stringify(data.userSettings)
        );
      }
      
      return true;
    } catch (error) {
      console.error('Import data error:', error);
      return false;
    }
  },

  // 清空所有數據
  clearAll: () => {
    const keys = Object.values(STORAGE_KEYS);
    let success = true;
    
    keys.forEach(key => {
      if (!safeLocalStorage.removeItem(key)) {
        success = false;
      }
    });
    
    return success;
  }
};

/**
 * React Hook for localStorage operations
 */
import { useState, useEffect } from 'react';

export const useLocalStore = (service, initialData = null) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const loadedData = service.getAll();
      setData(loadedData);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('useLocalStore error:', err);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const updateData = (newData) => {
    try {
      setData(newData);
      setError(null);
    } catch (err) {
      setError(err);
      console.error('updateData error:', err);
    }
  };

  return {
    data,
    loading,
    error,
    updateData,
    reload: () => {
      setLoading(true);
      try {
        const loadedData = service.getAll();
        setData(loadedData);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
  };
};

export default {
  transaction: transactionService,
  stockPrice: stockPriceService,
  exchangeRate: exchangeRateService,
  userSettings: userSettingsService,
  backup: backupService,
  useLocalStore
};

