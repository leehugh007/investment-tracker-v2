// API服務管理器 - 按照架構文檔設計
class APIManager {
  constructor() {
    // API Keys - 按照架構文檔配置
    this.FINNHUB_API_KEY = 'd1cd8n1r01qre5al6mbgd1cd8n1r01qre5al6mc0';
    this.EXCHANGE_API_KEY = 'b2c5ad8a96b0bafd62e49709';
    
    // Yahoo Finance API 端點 (本地開發)
    this.YAHOO_FINANCE_API_BASE = 'http://localhost:5001/api';
    
    // 緩存管理
    this.cache = new Map();
    this.cacheTimeout = {
      stockPrice: 5 * 60 * 1000,    // 5分鐘
      stockName: 24 * 60 * 60 * 1000, // 24小時
      exchangeRate: 60 * 60 * 1000   // 1小時
    };
  }

  // 緩存管理方法
  setCache(key, data, ttl) {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  // 美股股價查詢 (Finnhub API)
  async getUSStockPrice(symbol) {
    const cacheKey = `us_price_${symbol}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.FINNHUB_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.c === 0) {
        throw new Error('股票代號無效或市場已關閉');
      }

      const result = {
        symbol,
        currentPrice: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
        timestamp: Date.now()
      };

      this.setCache(cacheKey, result, this.cacheTimeout.stockPrice);
      return result;
      
    } catch (error) {
      console.error(`美股價格查詢失敗 (${symbol}):`, error);
      throw new Error(`無法獲取 ${symbol} 的股價: ${error.message}`);
    }
  }

  // 美股公司資訊查詢 (股票名稱功能)
  async getUSStockInfo(symbol) {
    const cacheKey = `us_info_${symbol}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${this.FINNHUB_API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.name) {
        throw new Error('找不到該股票代號');
      }

      const result = {
        symbol,
        name: data.name,
        industry: data.finnhubIndustry || 'N/A',
        country: data.country || 'US',
        currency: data.currency || 'USD',
        marketCapitalization: data.marketCapitalization,
        timestamp: Date.now()
      };

      this.setCache(cacheKey, result, this.cacheTimeout.stockName);
      return result;
      
    } catch (error) {
      console.error(`美股資訊查詢失敗 (${symbol}):`, error);
      throw new Error(`無法獲取 ${symbol} 的公司資訊: ${error.message}`);
    }
  }

  // 台股股價查詢 (FinMind API)
  async getTWStockPrice(symbol) {
    const cacheKey = `tw_price_${symbol}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // 獲取最近5天的數據以確保有最新價格
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const response = await fetch(
        `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${symbol}&start_date=${startDate}&end_date=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('股票代號無效或無價格數據');
      }

      // 取最新的價格數據
      const latestData = data.data[data.data.length - 1];
      
      const result = {
        symbol,
        currentPrice: latestData.close,
        change: latestData.close - latestData.open,
        changePercent: ((latestData.close - latestData.open) / latestData.open * 100).toFixed(2),
        high: latestData.max,
        low: latestData.min,
        open: latestData.open,
        volume: latestData.Trading_Volume,
        date: latestData.date,
        timestamp: Date.now()
      };

      this.setCache(cacheKey, result, this.cacheTimeout.stockPrice);
      return result;
      
    } catch (error) {
      console.error(`台股價格查詢失敗 (${symbol}):`, error);
      throw new Error(`無法獲取 ${symbol} 的股價: ${error.message}`);
    }
  }

  // 台股公司資訊查詢 (股票名稱功能)
  async getTWStockInfo(symbol) {
    const cacheKey = `tw_info_${symbol}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInfo&data_id=${symbol}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('找不到該股票代號');
      }

      const stockInfo = data.data[0];
      
      const result = {
        symbol,
        name: stockInfo.stock_name,
        industry: stockInfo.industry_category || 'N/A',
        market: stockInfo.market_category || 'N/A',
        currency: 'TWD',
        timestamp: Date.now()
      };

      this.setCache(cacheKey, result, this.cacheTimeout.stockName);
      return result;
      
    } catch (error) {
      console.error(`台股資訊查詢失敗 (${symbol}):`, error);
      throw new Error(`無法獲取 ${symbol} 的公司資訊: ${error.message}`);
    }
  }

  // 匯率查詢 (ExchangeRate API)
  async getExchangeRates() {
    const cacheKey = 'exchange_rates';
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `https://v6.exchangerate-api.com/v6/${this.EXCHANGE_API_KEY}/latest/TWD`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.result !== 'success') {
        throw new Error('匯率API調用失敗');
      }

      const result = {
        USD_TWD: 1 / data.conversion_rates.USD,
        HKD_TWD: 1 / data.conversion_rates.HKD,
        JPY_TWD: 1 / data.conversion_rates.JPY,
        timestamp: Date.now(),
        lastUpdate: data.time_last_update_utc
      };

      this.setCache(cacheKey, result, this.cacheTimeout.exchangeRate);
      return result;
      
    } catch (error) {
      console.error('匯率查詢失敗:', error);
      throw new Error(`無法獲取匯率數據: ${error.message}`);
    }
  }

  // 港股股價查詢 (Yahoo Finance API)
  async getHKStockPrice(symbol) {
    const cacheKey = `hk_price_${symbol}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.YAHOO_FINANCE_API_BASE}/stock-price/${symbol}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const result = {
        symbol: data.symbol,
        currentPrice: data.currentPrice,
        change: data.change,
        changePercent: data.changePercent,
        high: data.dayHigh,
        low: data.dayLow,
        open: data.open,
        previousClose: data.previousClose,
        timestamp: data.timestamp
      };

      this.setCache(cacheKey, result, this.cacheTimeout.stockPrice);
      return result;
      
    } catch (error) {
      console.error(`港股價格查詢失敗 (${symbol}):`, error);
      throw new Error(`無法獲取 ${symbol} 的股價: ${error.message}`);
    }
  }

  // 港股公司資訊查詢 (Yahoo Finance API)
  async getHKStockInfo(symbol) {
    const cacheKey = `hk_info_${symbol}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.YAHOO_FINANCE_API_BASE}/stock-info/${symbol}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const result = {
        symbol: data.symbol,
        name: data.name,
        industry: data.industry || 'N/A',
        sector: data.sector || 'N/A',
        currency: data.currency || 'HKD',
        exchange: data.exchange || 'HKG',
        timestamp: data.timestamp
      };

      this.setCache(cacheKey, result, this.cacheTimeout.stockName);
      return result;
      
    } catch (error) {
      console.error(`港股資訊查詢失敗 (${symbol}):`, error);
      throw new Error(`無法獲取 ${symbol} 的公司資訊: ${error.message}`);
    }
  }

  // 港股股價查詢 (使用Vercel Functions)
  async getHKStockPrice(symbol) {
    const cacheKey = `hk_price_${symbol}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`/api?symbol=${symbol}&action=price`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const stockData = {
        symbol: data.symbol,
        currentPrice: data.currentPrice,
        change: data.change,
        changePercent: data.changePercent,
        high: data.high,
        low: data.low,
        open: data.open,
        previousClose: data.previousClose,
        timestamp: Date.now()
      };

      this.setCache(cacheKey, stockData, this.cacheTimeout.stockPrice);
      return stockData;
      
    } catch (error) {
      console.error(`港股價格查詢失敗 (${symbol}):`, error);
      throw new Error(`無法獲取 ${symbol} 的股價: ${error.message}`);
    }
  }  // 港股公司資訊查詢 (使用Vercel Functions)
  async getHKStockInfo(symbol) {
    const cacheKey = `hk_info_${symbol}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`/api?symbol=${symbol}&action=info`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const result = {
        symbol: data.symbol,
        name: data.name,
        industry: data.industry || 'N/A',
        sector: data.sector || 'N/A',
        currency: data.currency || 'HKD',
        exchange: data.exchange || 'HKG',
        timestamp: Date.now()
      };

      this.setCache(cacheKey, result, this.cacheTimeout.stockName);
      return result;
      
    } catch (error) {
      console.error(`港股資訊查詢失敗 (${symbol}):`, error);
      throw new Error(`無法獲取 ${symbol} 的公司資訊: ${error.message}`);
    }
  }

  // 日股股價查詢 (使用Vercel Functions)
  async getJPStockPrice(symbol) {
    const cacheKey = `jp_price_${symbol}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`/api?symbol=${symbol}&action=price`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const stockData = {
        symbol: data.symbol,
        currentPrice: data.currentPrice,
        change: data.change,
        changePercent: data.changePercent,
        high: data.high,
        low: data.low,
        open: data.open,
        previousClose: data.previousClose,
        timestamp: Date.now()
      };

      this.setCache(cacheKey, stockData, this.cacheTimeout.stockPrice);
      return stockData;
      
    } catch (error) {
      console.error(`日股價格查詢失敗 (${symbol}):`, error);
      throw new Error(`無法獲取 ${symbol} 的股價: ${error.message}`);
    }
  }

  // 日股公司資訊查詢 (使用Vercel Functions)
  async getJPStockInfo(symbol) {
    const cacheKey = `jp_info_${symbol}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`/api?symbol=${symbol}&action=info`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const result = {
        symbol: data.symbol,
        name: data.name,
        industry: data.industry || 'N/A',
        sector: data.sector || 'N/A',
        currency: data.currency || 'JPY',
        exchange: data.exchange || 'JPX',
        timestamp: Date.now()
      };

      this.setCache(cacheKey, result, this.cacheTimeout.stockName);
      return result;
      
    } catch (error) {
      console.error(`日股資訊查詢失敗 (${symbol}):`, error);
      throw new Error(`無法獲取 ${symbol} 的公司資訊: ${error.message}`);
    }
  }

  // 統一股價查詢接口
  async getStockPrice(symbol, market) {
    switch (market) {
      case 'US':
        return await this.getUSStockPrice(symbol);
      case 'TW':
        return await this.getTWStockPrice(symbol);
      case 'HK':
        return await this.getHKStockPrice(symbol);
      case 'JP':
        return await this.getJPStockPrice(symbol);
      default:
        throw new Error(`不支援的市場: ${market}`);
    }
  }

  // 統一股票資訊查詢接口 (股票名稱功能)
  async getStockInfo(symbol, market) {
    switch (market) {
      case 'US':
        return await this.getUSStockInfo(symbol);
      case 'TW':
        return await this.getTWStockInfo(symbol);
      case 'HK':
        return await this.getHKStockInfo(symbol);
      case 'JP':
        return await this.getJPStockInfo(symbol);
      default:
        throw new Error(`不支援的市場: ${market}`);
    }
  }

  // 批次股價更新
  async updateMultipleStockPrices(stocks) {
    const results = [];
    const errors = [];

    for (const stock of stocks) {
      try {
        const price = await this.getStockPrice(stock.symbol, stock.market);
        results.push({ ...stock, ...price, success: true });
      } catch (error) {
        errors.push({ ...stock, error: error.message, success: false });
      }
    }

    return { results, errors };
  }

  // 清除緩存
  clearCache() {
    this.cache.clear();
  }

  // 獲取緩存統計
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of this.cache.entries()) {
      if (value.expiry > now) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries
    };
  }
}

// 創建全局實例
const apiManager = new APIManager();

export default apiManager;

