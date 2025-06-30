/**
 * 持股計算邏輯測試
 * 
 * 測試場景：
 * 1. 基本持股計算
 * 2. FIFO配對邏輯
 * 3. 賣出驗證
 * 4. 邊界條件處理
 */

import {
  calculateHoldings,
  calculateAllHoldings,
  validateSellTransaction,
  processSellTransaction,
  createEnhancedTransaction,
  getHoldingsSummary
} from '../holdingsCalculator.js';

// 測試資料
const mockTransactions = [
  {
    id: '1',
    symbol: 'AAPL',
    stockName: 'Apple Inc',
    market: 'US',
    type: 'BUY',
    quantity: 100,
    price: 150,
    date: '2025-01-01',
    currency: 'USD',
    timestamp: '2025-01-01T10:00:00.000Z',
    remainingQuantity: 100,
    isFullySold: false,
    linkedBuyIds: []
  },
  {
    id: '2',
    symbol: 'AAPL',
    stockName: 'Apple Inc',
    market: 'US',
    type: 'BUY',
    quantity: 50,
    price: 160,
    date: '2025-01-02',
    currency: 'USD',
    timestamp: '2025-01-02T10:00:00.000Z',
    remainingQuantity: 50,
    isFullySold: false,
    linkedBuyIds: []
  },
  {
    id: '3',
    symbol: 'GOOGL',
    stockName: 'Alphabet Inc',
    market: 'US',
    type: 'BUY',
    quantity: 20,
    price: 2800,
    date: '2025-01-03',
    currency: 'USD',
    timestamp: '2025-01-03T10:00:00.000Z',
    remainingQuantity: 20,
    isFullySold: false,
    linkedBuyIds: []
  }
];

describe('持股計算邏輯測試', () => {
  
  describe('calculateHoldings', () => {
    test('應該正確計算單一股票的持股', () => {
      const holdings = calculateHoldings('AAPL', mockTransactions);
      
      expect(holdings.symbol).toBe('AAPL');
      expect(holdings.totalQuantity).toBe(150);
      expect(holdings.averageCost).toBe(153.33); // (100*150 + 50*160) / 150
      expect(holdings.totalCost).toBe(23000);
      expect(holdings.canSell).toBe(true);
      expect(holdings.availablePositions).toHaveLength(2);
    });
    
    test('應該處理沒有持股的情況', () => {
      const holdings = calculateHoldings('TSLA', mockTransactions);
      
      expect(holdings.totalQuantity).toBe(0);
      expect(holdings.canSell).toBe(false);
      expect(holdings.availablePositions).toHaveLength(0);
    });
  });
  
  describe('validateSellTransaction', () => {
    test('應該允許有效的賣出交易', () => {
      const validation = validateSellTransaction('AAPL', 100, mockTransactions);
      
      expect(validation.isValid).toBe(true);
      expect(validation.availableQuantity).toBe(150);
    });
    
    test('應該拒絕超量賣出', () => {
      const validation = validateSellTransaction('AAPL', 200, mockTransactions);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('超過持有數量');
      expect(validation.availableQuantity).toBe(150);
    });
    
    test('應該拒絕賣出未持有的股票', () => {
      const validation = validateSellTransaction('TSLA', 10, mockTransactions);
      
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('沒有持有');
      expect(validation.availableQuantity).toBe(0);
    });
  });
  
  describe('processSellTransaction', () => {
    test('應該正確執行FIFO配對 - 部分賣出', () => {
      const result = processSellTransaction('AAPL', 80, mockTransactions);
      
      expect(result.success).toBe(true);
      expect(result.linkedBuyIds).toEqual(['1']);
      expect(result.remainingSellQuantity).toBe(0);
      
      // 檢查更新後的交易
      const updatedBuyTx = result.updatedTransactions.find(t => t.id === '1');
      expect(updatedBuyTx.remainingQuantity).toBe(20);
      expect(updatedBuyTx.isFullySold).toBe(false);
    });
    
    test('應該正確執行FIFO配對 - 跨多筆買入', () => {
      const result = processSellTransaction('AAPL', 120, mockTransactions);
      
      expect(result.success).toBe(true);
      expect(result.linkedBuyIds).toEqual(['1', '2']);
      expect(result.remainingSellQuantity).toBe(0);
      
      // 檢查第一筆買入交易完全賣出
      const firstBuyTx = result.updatedTransactions.find(t => t.id === '1');
      expect(firstBuyTx.remainingQuantity).toBe(0);
      expect(firstBuyTx.isFullySold).toBe(true);
      
      // 檢查第二筆買入交易部分賣出
      const secondBuyTx = result.updatedTransactions.find(t => t.id === '2');
      expect(secondBuyTx.remainingQuantity).toBe(30);
      expect(secondBuyTx.isFullySold).toBe(false);
    });
  });
  
  describe('createEnhancedTransaction', () => {
    test('應該創建增強的買入交易', () => {
      const transactionData = {
        symbol: 'MSFT',
        stockName: 'Microsoft Corp',
        market: 'US',
        type: 'BUY',
        quantity: 50,
        price: 300,
        date: '2025-01-04',
        currency: 'USD'
      };
      
      const enhanced = createEnhancedTransaction(transactionData);
      
      expect(enhanced.type).toBe('BUY');
      expect(enhanced.remainingQuantity).toBe(50);
      expect(enhanced.isFullySold).toBe(false);
      expect(enhanced.linkedBuyIds).toEqual([]);
    });
    
    test('應該創建增強的賣出交易並執行配對', () => {
      const transactionData = {
        symbol: 'AAPL',
        stockName: 'Apple Inc',
        market: 'US',
        type: 'SELL',
        quantity: 80,
        price: 155,
        date: '2025-01-04',
        currency: 'USD'
      };
      
      const enhanced = createEnhancedTransaction(transactionData, mockTransactions);
      
      expect(enhanced.type).toBe('SELL');
      expect(enhanced.remainingQuantity).toBe(0);
      expect(enhanced.isFullySold).toBe(true);
      expect(enhanced.linkedBuyIds).toEqual(['1']);
    });
    
    test('應該拒絕無效的賣出交易', () => {
      const transactionData = {
        symbol: 'TSLA',
        type: 'SELL',
        quantity: 10,
        price: 800,
        date: '2025-01-04',
        currency: 'USD'
      };
      
      expect(() => {
        createEnhancedTransaction(transactionData, mockTransactions);
      }).toThrow();
    });
  });
  
  describe('calculateAllHoldings', () => {
    test('應該計算所有股票的持股', () => {
      const allHoldings = calculateAllHoldings(mockTransactions);
      
      expect(Object.keys(allHoldings)).toEqual(['AAPL', 'GOOGL']);
      expect(allHoldings.AAPL.totalQuantity).toBe(150);
      expect(allHoldings.GOOGL.totalQuantity).toBe(20);
    });
  });
  
  describe('getHoldingsSummary', () => {
    test('應該生成持股摘要', () => {
      const summary = getHoldingsSummary(mockTransactions);
      
      expect(summary.totalSymbols).toBe(2);
      expect(summary.totalCost).toBe(79000); // 23000 + 56000
      expect(summary.holdings).toHaveProperty('AAPL');
      expect(summary.holdings).toHaveProperty('GOOGL');
    });
  });
  
  describe('邊界條件測試', () => {
    test('應該處理空交易陣列', () => {
      const holdings = calculateHoldings('AAPL', []);
      expect(holdings.totalQuantity).toBe(0);
      expect(holdings.canSell).toBe(false);
    });
    
    test('應該處理向後兼容性 - 沒有新欄位的舊交易', () => {
      const oldTransaction = {
        id: '4',
        symbol: 'AAPL',
        type: 'BUY',
        quantity: 100,
        price: 150,
        timestamp: '2025-01-01T10:00:00.000Z'
        // 沒有 remainingQuantity, isFullySold, linkedBuyIds
      };
      
      const holdings = calculateHoldings('AAPL', [oldTransaction]);
      expect(holdings.totalQuantity).toBe(100);
      expect(holdings.canSell).toBe(true);
    });
  });
});

// 如果在Node.js環境中運行測試
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    mockTransactions
  };
}

