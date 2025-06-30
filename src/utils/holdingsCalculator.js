/**
 * 持股計算邏輯模組
 * 
 * 功能：
 * 1. 計算每支股票的當前持股數量
 * 2. 支援FIFO配對邏輯
 * 3. 處理買賣交易的關聯
 * 4. 提供賣出驗證所需的資訊
 */

/**
 * 計算指定股票的當前持股資訊
 * @param {string} symbol - 股票代碼
 * @param {Array} transactions - 所有交易記錄
 * @returns {Object} 持股資訊
 */
export function calculateHoldings(symbol, transactions) {
  // 過濾出指定股票的交易
  const stockTransactions = transactions.filter(t => t.symbol === symbol);
  
  // 分離買入和賣出交易
  const buyTransactions = stockTransactions.filter(t => t.type === 'BUY');
  const sellTransactions = stockTransactions.filter(t => t.type === 'SELL');
  
  // 初始化買入交易的剩餘數量（向後兼容）
  const processedBuyTransactions = buyTransactions.map(transaction => ({
    ...transaction,
    remainingQuantity: transaction.remainingQuantity ?? transaction.quantity,
    isFullySold: transaction.isFullySold ?? false
  }));
  
  // 按時間排序（FIFO）
  processedBuyTransactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  // 計算總持股
  let totalHoldings = 0;
  let totalCost = 0;
  let availablePositions = [];
  
  // 處理買入交易
  processedBuyTransactions.forEach(buyTx => {
    if (!buyTx.isFullySold && buyTx.remainingQuantity > 0) {
      totalHoldings += buyTx.remainingQuantity;
      totalCost += buyTx.remainingQuantity * buyTx.price;
      availablePositions.push({
        transactionId: buyTx.id,
        quantity: buyTx.remainingQuantity,
        price: buyTx.price,
        date: buyTx.date
      });
    }
  });
  
  // 計算平均成本
  const averageCost = totalHoldings > 0 ? totalCost / totalHoldings : 0;
  
  return {
    symbol,
    totalQuantity: totalHoldings,
    averageCost: parseFloat(averageCost.toFixed(2)),
    totalCost: parseFloat(totalCost.toFixed(2)),
    availablePositions,
    canSell: totalHoldings > 0
  };
}

/**
 * 計算所有股票的持股資訊
 * @param {Array} transactions - 所有交易記錄
 * @returns {Object} 所有股票的持股資訊
 */
export function calculateAllHoldings(transactions) {
  // 獲取所有唯一的股票代碼
  const symbols = [...new Set(transactions.map(t => t.symbol))];
  
  const holdings = {};
  symbols.forEach(symbol => {
    const holding = calculateHoldings(symbol, transactions);
    if (holding.totalQuantity > 0) {
      holdings[symbol] = holding;
    }
  });
  
  return holdings;
}

/**
 * 檢查是否可以賣出指定數量的股票
 * @param {string} symbol - 股票代碼
 * @param {number} quantity - 要賣出的數量
 * @param {Array} transactions - 所有交易記錄
 * @returns {Object} 驗證結果
 */
export function validateSellTransaction(symbol, quantity, transactions) {
  const holdings = calculateHoldings(symbol, transactions);
  
  if (!holdings.canSell) {
    return {
      isValid: false,
      error: `您目前沒有持有 ${symbol} 股票`,
      availableQuantity: 0
    };
  }
  
  if (quantity > holdings.totalQuantity) {
    return {
      isValid: false,
      error: `賣出數量 (${quantity}) 超過持有數量 (${holdings.totalQuantity})`,
      availableQuantity: holdings.totalQuantity
    };
  }
  
  return {
    isValid: true,
    availableQuantity: holdings.totalQuantity,
    holdings
  };
}

/**
 * 執行FIFO配對邏輯，處理賣出交易
 * @param {string} symbol - 股票代碼
 * @param {number} sellQuantity - 賣出數量
 * @param {Array} transactions - 所有交易記錄
 * @returns {Object} 配對結果
 */
export function processSellTransaction(symbol, sellQuantity, transactions) {
  const validation = validateSellTransaction(symbol, sellQuantity, transactions);
  
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error,
      updatedTransactions: transactions
    };
  }
  
  // 複製交易陣列以避免修改原始資料
  const updatedTransactions = [...transactions];
  let remainingSellQuantity = sellQuantity;
  const linkedBuyIds = [];
  
  // 獲取可用的買入交易（按FIFO順序）
  const availablePositions = validation.holdings.availablePositions;
  
  // 執行FIFO配對
  for (const position of availablePositions) {
    if (remainingSellQuantity <= 0) break;
    
    // 找到對應的買入交易
    const buyTransactionIndex = updatedTransactions.findIndex(
      t => t.id === position.transactionId
    );
    
    if (buyTransactionIndex === -1) continue;
    
    const buyTransaction = updatedTransactions[buyTransactionIndex];
    const currentRemaining = buyTransaction.remainingQuantity ?? buyTransaction.quantity;
    
    if (currentRemaining <= 0) continue;
    
    // 計算這次配對的數量
    const matchedQuantity = Math.min(remainingSellQuantity, currentRemaining);
    
    // 更新買入交易的剩餘數量
    updatedTransactions[buyTransactionIndex] = {
      ...buyTransaction,
      remainingQuantity: currentRemaining - matchedQuantity,
      isFullySold: (currentRemaining - matchedQuantity) === 0
    };
    
    // 記錄配對關係
    linkedBuyIds.push(position.transactionId);
    
    // 減少剩餘賣出數量
    remainingSellQuantity -= matchedQuantity;
  }
  
  return {
    success: true,
    linkedBuyIds,
    updatedTransactions,
    remainingSellQuantity
  };
}

/**
 * 創建增強的交易物件（包含新的資料結構欄位）
 * @param {Object} transactionData - 基本交易資料
 * @param {Array} existingTransactions - 現有交易記錄
 * @returns {Object} 增強的交易物件
 */
export function createEnhancedTransaction(transactionData, existingTransactions = []) {
  const baseTransaction = {
    id: Date.now().toString(),
    symbol: transactionData.symbol.toUpperCase(),
    stockName: transactionData.stockName || transactionData.symbol.toUpperCase(),
    market: transactionData.market,
    type: transactionData.type,
    quantity: parseInt(transactionData.quantity),
    price: parseFloat(transactionData.price),
    date: transactionData.date,
    currency: transactionData.currency,
    timestamp: new Date().toISOString()
  };
  
  // 根據交易類型添加相應欄位
  if (transactionData.type === 'BUY') {
    return {
      ...baseTransaction,
      remainingQuantity: baseTransaction.quantity,
      isFullySold: false,
      linkedBuyIds: [] // 買入交易不需要，但為了一致性保留
    };
  } else if (transactionData.type === 'SELL') {
    // 處理賣出交易的配對邏輯
    const sellResult = processSellTransaction(
      baseTransaction.symbol,
      baseTransaction.quantity,
      existingTransactions
    );
    
    if (!sellResult.success) {
      throw new Error(sellResult.error);
    }
    
    return {
      ...baseTransaction,
      linkedBuyIds: sellResult.linkedBuyIds,
      remainingQuantity: 0, // 賣出交易沒有剩餘數量
      isFullySold: true // 賣出交易總是完全執行
    };
  }
  
  return baseTransaction;
}

/**
 * 獲取持股摘要統計
 * @param {Array} transactions - 所有交易記錄
 * @returns {Object} 持股摘要
 */
export function getHoldingsSummary(transactions) {
  const allHoldings = calculateAllHoldings(transactions);
  const symbols = Object.keys(allHoldings);
  
  let totalValue = 0;
  let totalCost = 0;
  
  symbols.forEach(symbol => {
    const holding = allHoldings[symbol];
    totalCost += holding.totalCost;
    // 注意：這裡需要當前市價來計算總價值，暫時使用成本價
    totalValue += holding.totalCost;
  });
  
  return {
    totalSymbols: symbols.length,
    totalCost: parseFloat(totalCost.toFixed(2)),
    totalValue: parseFloat(totalValue.toFixed(2)), // 需要整合即時價格
    unrealizedPnL: 0, // 需要即時價格計算
    holdings: allHoldings
  };
}

