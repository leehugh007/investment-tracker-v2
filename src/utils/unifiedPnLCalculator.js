import apiManager from '../services/apiManager';

// 多市場統一損益計算引擎
class UnifiedPnLCalculator {
  constructor() {
    this.exchangeRates = null;
    this.lastRateUpdate = null;
  }

  // 更新匯率數據
  async updateExchangeRates() {
    try {
      this.exchangeRates = await apiManager.getExchangeRates();
      this.lastRateUpdate = Date.now();
      return this.exchangeRates;
    } catch (error) {
      console.error('匯率更新失敗:', error);
      // 使用備用匯率
      this.exchangeRates = {
        USD_TWD: 28.5,
        HKD_TWD: 3.7,
        JPY_TWD: 0.2,
        timestamp: Date.now()
      };
      return this.exchangeRates;
    }
  }

  // 轉換為TWD
  convertToTWD(amount, currency) {
    if (!this.exchangeRates) {
      throw new Error('匯率數據未載入，請先調用 updateExchangeRates()');
    }

    switch (currency) {
      case 'USD':
        return amount * this.exchangeRates.USD_TWD;
      case 'HKD':
        return amount * this.exchangeRates.HKD_TWD;
      case 'JPY':
        return amount * this.exchangeRates.JPY_TWD;
      case 'TWD':
        return amount;
      default:
        console.warn(`不支援的幣種: ${currency}，使用原始金額`);
        return amount;
    }
  }

  // 獲取市場幣種
  getMarketCurrency(market) {
    const currencies = {
      'US': 'USD',
      'TW': 'TWD',
      'HK': 'HKD',
      'JP': 'JPY'
    };
    return currencies[market] || 'TWD';
  }

  // FIFO計算已實現損益
  calculateRealizedPnL(transactions) {
    const holdings = new Map(); // symbol -> [{ quantity, price, date }]
    const realizedPnL = [];

    // 按日期排序
    const sortedTransactions = transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    for (const tx of sortedTransactions) {
      const key = `${tx.market}:${tx.symbol}`;
      
      if (tx.type === 'BUY') {
        // 買入：加入持股
        if (!holdings.has(key)) {
          holdings.set(key, []);
        }
        holdings.get(key).push({
          quantity: tx.quantity,
          price: tx.price,
          date: tx.date,
          currency: this.getMarketCurrency(tx.market)
        });
      } else if (tx.type === 'SELL') {
        // 賣出：FIFO計算損益
        if (!holdings.has(key) || holdings.get(key).length === 0) {
          console.warn(`賣出 ${tx.symbol} 但無持股記錄`);
          continue;
        }

        let remainingToSell = tx.quantity;
        let totalCost = 0;
        let totalRevenue = tx.quantity * tx.price;
        const currency = this.getMarketCurrency(tx.market);

        while (remainingToSell > 0 && holdings.get(key).length > 0) {
          const oldestHolding = holdings.get(key)[0];
          
          if (oldestHolding.quantity <= remainingToSell) {
            // 完全賣出這筆持股
            totalCost += oldestHolding.quantity * oldestHolding.price;
            remainingToSell -= oldestHolding.quantity;
            holdings.get(key).shift();
          } else {
            // 部分賣出
            totalCost += remainingToSell * oldestHolding.price;
            oldestHolding.quantity -= remainingToSell;
            remainingToSell = 0;
          }
        }

        // 計算已實現損益
        const realizedAmount = totalRevenue - totalCost;
        const realizedAmountTWD = this.convertToTWD(realizedAmount, currency);

        realizedPnL.push({
          symbol: tx.symbol,
          market: tx.market,
          sellDate: tx.date,
          quantity: tx.quantity,
          sellPrice: tx.price,
          avgCost: totalCost / tx.quantity,
          realizedPnL: realizedAmount,
          realizedPnLTWD: realizedAmountTWD,
          currency: currency,
          returnRate: ((totalRevenue - totalCost) / totalCost * 100).toFixed(2)
        });
      }
    }

    return realizedPnL;
  }

  // 計算未實現損益
  async calculateUnrealizedPnL(transactions, currentPrices = {}) {
    const holdings = new Map();
    const unrealizedPnL = [];

    // 計算當前持股
    for (const tx of transactions) {
      const key = `${tx.market}:${tx.symbol}`;
      
      if (!holdings.has(key)) {
        holdings.set(key, {
          symbol: tx.symbol,
          market: tx.market,
          totalQuantity: 0,
          totalCost: 0,
          currency: this.getMarketCurrency(tx.market)
        });
      }

      const holding = holdings.get(key);
      
      if (tx.type === 'BUY') {
        holding.totalQuantity += tx.quantity;
        holding.totalCost += tx.quantity * tx.price;
      } else if (tx.type === 'SELL') {
        holding.totalQuantity -= tx.quantity;
        // FIFO成本計算（簡化版）
        holding.totalCost -= tx.quantity * (holding.totalCost / (holding.totalQuantity + tx.quantity));
      }
    }

    // 計算未實現損益
    for (const [key, holding] of holdings) {
      if (holding.totalQuantity <= 0) continue;

      const avgCost = holding.totalCost / holding.totalQuantity;
      let currentPrice = currentPrices[key] || avgCost; // 如果沒有當前價格，使用成本價

      // 嘗試獲取最新價格
      try {
        const priceData = await apiManager.getStockPrice(holding.symbol, holding.market);
        currentPrice = priceData.currentPrice;
      } catch (error) {
        console.warn(`無法獲取 ${holding.symbol} 的當前價格:`, error.message);
      }

      const unrealizedAmount = (currentPrice - avgCost) * holding.totalQuantity;
      const unrealizedAmountTWD = this.convertToTWD(unrealizedAmount, holding.currency);
      const currentValueTWD = this.convertToTWD(currentPrice * holding.totalQuantity, holding.currency);
      const totalCostTWD = this.convertToTWD(holding.totalCost, holding.currency);

      unrealizedPnL.push({
        symbol: holding.symbol,
        market: holding.market,
        quantity: holding.totalQuantity,
        avgCost: avgCost,
        currentPrice: currentPrice,
        unrealizedPnL: unrealizedAmount,
        unrealizedPnLTWD: unrealizedAmountTWD,
        currentValueTWD: currentValueTWD,
        totalCostTWD: totalCostTWD,
        currency: holding.currency,
        returnRate: ((currentPrice - avgCost) / avgCost * 100).toFixed(2)
      });
    }

    return unrealizedPnL;
  }

  // 計算投資組合總覽
  async calculatePortfolioSummary(transactions) {
    // 確保匯率數據是最新的
    if (!this.exchangeRates || Date.now() - this.lastRateUpdate > 60 * 60 * 1000) {
      await this.updateExchangeRates();
    }

    const realizedPnL = this.calculateRealizedPnL(transactions);
    const unrealizedPnL = await this.calculateUnrealizedPnL(transactions);

    // 計算總計
    const totalRealizedPnLTWD = realizedPnL.reduce((sum, item) => sum + item.realizedPnLTWD, 0);
    const totalUnrealizedPnLTWD = unrealizedPnL.reduce((sum, item) => sum + item.unrealizedPnLTWD, 0);
    const totalCurrentValueTWD = unrealizedPnL.reduce((sum, item) => sum + item.currentValueTWD, 0);
    const totalCostTWD = unrealizedPnL.reduce((sum, item) => sum + item.totalCostTWD, 0);

    // 計算各市場分佈
    const marketDistribution = {};
    const marketTotals = { US: 0, TW: 0, HK: 0, JP: 0 };
    
    unrealizedPnL.forEach(item => {
      marketTotals[item.market] += item.currentValueTWD;
    });

    Object.keys(marketTotals).forEach(market => {
      marketDistribution[market] = totalCurrentValueTWD > 0 
        ? ((marketTotals[market] / totalCurrentValueTWD) * 100).toFixed(1)
        : 0;
    });

    return {
      // 總覽數據
      totalInvestmentTWD: totalCostTWD,
      totalCurrentValueTWD: totalCurrentValueTWD,
      totalRealizedPnLTWD: totalRealizedPnLTWD,
      totalUnrealizedPnLTWD: totalUnrealizedPnLTWD,
      totalPnLTWD: totalRealizedPnLTWD + totalUnrealizedPnLTWD,
      totalReturnRate: totalCostTWD > 0 ? 
        (((totalCurrentValueTWD + totalRealizedPnLTWD - totalCostTWD) / totalCostTWD) * 100).toFixed(2) : 0,
      
      // 市場分佈
      marketDistribution: marketDistribution,
      marketTotals: marketTotals,
      
      // 詳細數據
      realizedPnL: realizedPnL,
      unrealizedPnL: unrealizedPnL,
      
      // 匯率資訊
      exchangeRates: this.exchangeRates,
      lastRateUpdate: new Date(this.lastRateUpdate).toLocaleString()
    };
  }

  // 格式化TWD金額
  formatTWD(amount) {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  }

  // 獲取匯率狀態
  getExchangeRateStatus() {
    return {
      loaded: !!this.exchangeRates,
      lastUpdate: this.lastRateUpdate ? new Date(this.lastRateUpdate).toLocaleString() : null,
      rates: this.exchangeRates
    };
  }
}

// 創建全局實例
const unifiedPnLCalculator = new UnifiedPnLCalculator();

export default unifiedPnLCalculator;

