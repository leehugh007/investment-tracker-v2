import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  BarChart3, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Activity,
  AlertCircle
} from 'lucide-react';
import StockPriceUpdater from '../components/StockPriceUpdater';
import QuickSellModal from '../components/QuickSellModal';
import { transactionService, stockPriceService, useLocalStore } from '../hooks/useLocalStore';
import unifiedPnLCalculator from '../utils/unifiedPnLCalculator';
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge 
} from '../components/ui';

function USMarket() {
  const [stockPrices, setStockPrices] = useState({});
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [realizedPnLStats, setRealizedPnLStats] = useState({
    totalRealizedPnL: 0,
    realizedReturnRate: 0
  });

  // 使用新的 localStorage hook
  const { 
    data: transactions, 
    loading, 
    error, 
    reload: reloadTransactions 
  } = useLocalStore(transactionService, []);

  // 過濾美股交易記錄
  const usTransactions = transactions.filter(tx => tx.market === 'US');

  useEffect(() => {
    // 載入股價數據
    const loadStockPrices = () => {
      const allPrices = stockPriceService.getAll();
      setStockPrices(allPrices);
    };

    loadStockPrices();
  }, []);

  // 計算已實現損益
  useEffect(() => {
    const calculateRealizedPnL = async () => {
      try {
        if (usTransactions.length === 0) {
          setRealizedPnLStats({
            totalRealizedPnL: 0,
            realizedReturnRate: 0
          });
          return;
        }

        // 確保匯率已更新
        await unifiedPnLCalculator.updateExchangeRates();
        
        // 計算已實現損益
        const realizedPnL = unifiedPnLCalculator.calculateRealizedPnL(usTransactions);
        const totalRealizedUSD = realizedPnL.reduce((sum, item) => sum + (item.realizedPnL || 0), 0);
        
        // 計算已實現投資成本（用於計算已實現報酬率）
        const realizedCost = realizedPnL.reduce((sum, item) => {
          return sum + (item.quantity * item.avgCost);
        }, 0);
        
        const realizedReturnRate = realizedCost > 0 ? (totalRealizedUSD / realizedCost * 100) : 0;

        setRealizedPnLStats({
          totalRealizedPnL: totalRealizedUSD,
          realizedReturnRate
        });
      } catch (error) {
        console.error('計算已實現損益時發生錯誤:', error);
        setRealizedPnLStats({
          totalRealizedPnL: 0,
          realizedReturnRate: 0
        });
      }
    };

    calculateRealizedPnL();
  }, [usTransactions]);

  const handlePricesUpdated = (priceResults, market) => {
    if (market === 'US') {
      const newPrices = {};
      priceResults.forEach(result => {
        newPrices[result.symbol] = result;
      });
      
      // 使用服務層更新股價
      stockPriceService.updateBatch(newPrices);
      setStockPrices(prev => ({ ...prev, ...newPrices }));
    }
  };

  const handleSellClick = (holding) => {
    setSelectedHolding(holding);
    setSellModalOpen(true);
  };

  const handleSellComplete = () => {
    reloadTransactions(); // 重新載入交易記錄
    setSellModalOpen(false);
    setSelectedHolding(null);
  };

  // 計算持股統計
  const calculateHoldings = () => {
    const holdings = new Map();
    
    usTransactions.forEach(tx => {
      if (!holdings.has(tx.symbol)) {
        holdings.set(tx.symbol, {
          symbol: tx.symbol,
          stockName: tx.stockName || tx.symbol,
          totalQuantity: 0,
          totalCost: 0,
          avgCost: 0
        });
      }
      
      const holding = holdings.get(tx.symbol);
      if (tx.type === 'BUY') {
        holding.totalCost += tx.quantity * tx.price;
        holding.totalQuantity += tx.quantity;
      } else {
        holding.totalQuantity -= tx.quantity;
        // 簡化處理：賣出時按平均成本計算
        holding.totalCost -= tx.quantity * holding.avgCost;
      }
      
      if (holding.totalQuantity > 0) {
        holding.avgCost = holding.totalCost / holding.totalQuantity;
      }
    });

    return Array.from(holdings.values()).filter(h => h.totalQuantity > 0);
  };

  // 計算投資組合統計
  const calculatePortfolioStats = (holdings) => {
    let totalValue = 0;
    let totalCost = 0;
    let totalUnrealizedPnL = 0;

    holdings.forEach(holding => {
      const currentPrice = stockPrices[holding.symbol]?.currentPrice || 0;
      const marketValue = currentPrice * holding.totalQuantity;
      const cost = holding.totalCost;
      const unrealizedPnL = marketValue - cost;

      totalValue += marketValue;
      totalCost += cost;
      totalUnrealizedPnL += unrealizedPnL;
    });

    const totalReturnRate = totalCost > 0 ? (totalUnrealizedPnL / totalCost * 100) : 0;

    return {
      totalValue,
      totalCost,
      totalUnrealizedPnL,
      totalReturnRate
    };
  };

  // 處理載入狀態
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">載入中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 處理錯誤狀態
  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
                <p className="text-destructive mb-4">載入失敗: {error.message}</p>
                <Button onClick={reloadTransactions} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新載入
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const holdings = calculateHoldings();
  const portfolioStats = calculatePortfolioStats(holdings);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
            🇺🇸 美股投資組合
          </h1>
          <p className="text-muted-foreground">Finnhub API 自動更新股價</p>
        </div>

        {/* 投資組合概覽 */}
        {holdings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">總市值</p>
                    <p className="text-2xl font-bold">
                      ${portfolioStats.totalValue.toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">總成本</p>
                    <p className="text-2xl font-bold">
                      ${portfolioStats.totalCost.toLocaleString()}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">未實現損益</p>
                    <p className={`text-2xl font-bold ${
                      portfolioStats.totalUnrealizedPnL >= 0 ? 'text-positive' : 'text-negative'
                    }`}>
                      {portfolioStats.totalUnrealizedPnL >= 0 ? '+' : ''}
                      ${portfolioStats.totalUnrealizedPnL.toLocaleString()}
                    </p>
                  </div>
                  {portfolioStats.totalUnrealizedPnL >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-positive" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-negative" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">總報酬率</p>
                    <p className={`text-2xl font-bold ${
                      portfolioStats.totalReturnRate >= 0 ? 'text-positive' : 'text-negative'
                    }`}>
                      {portfolioStats.totalReturnRate >= 0 ? '+' : ''}
                      {portfolioStats.totalReturnRate.toFixed(2)}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">已實現損益</p>
                    <p className={`text-2xl font-bold ${
                      realizedPnLStats.totalRealizedPnL >= 0 ? 'text-positive' : 'text-negative'
                    }`}>
                      {realizedPnLStats.totalRealizedPnL >= 0 ? '+' : ''}
                      ${realizedPnLStats.totalRealizedPnL.toLocaleString()}
                    </p>
                  </div>
                  {realizedPnLStats.totalRealizedPnL >= 0 ? (
                    <TrendingUp className="w-8 h-8 text-positive" />
                  ) : (
                    <TrendingDown className="w-8 h-8 text-negative" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">已實現報酬率</p>
                    <p className={`text-2xl font-bold ${
                      realizedPnLStats.realizedReturnRate >= 0 ? 'text-positive' : 'text-negative'
                    }`}>
                      {realizedPnLStats.realizedReturnRate >= 0 ? '+' : ''}
                      {realizedPnLStats.realizedReturnRate.toFixed(2)}%
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 操作按鈕 */}
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <Link to="/add-transaction/us">
              <Plus className="w-4 h-4 mr-2" />
              新增交易
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              歷史分析
            </Link>
          </Button>
          <Button variant="outline" onClick={reloadTransactions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            重新載入
          </Button>
        </div>

        {/* 股價更新組件 */}
        <Card>
          <CardContent className="pt-6">
            <StockPriceUpdater
              transactions={usTransactions}
              onPricesUpdated={handlePricesUpdated}
              market="US"
            />
          </CardContent>
        </Card>

        {/* 持股明細 */}
        {holdings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>持股明細</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">股票代碼</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">公司名稱</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">持股數量</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">平均成本</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">當前價格</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">未實現損益</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">報酬率</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((holding, index) => {
                      const currentPrice = stockPrices[holding.symbol]?.currentPrice || 0;
                      const unrealizedPnL = currentPrice > 0 
                        ? (currentPrice - holding.avgCost) * holding.totalQuantity 
                        : 0;
                      const returnRate = holding.avgCost > 0 
                        ? ((currentPrice - holding.avgCost) / holding.avgCost * 100) 
                        : 0;

                      return (
                        <tr key={index} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium text-primary">
                            {holding.symbol}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {holding.stockName}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {holding.totalQuantity.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            ${holding.avgCost.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {currentPrice > 0 ? (
                              <div>
                                <div>${currentPrice.toFixed(2)}</div>
                                {stockPrices[holding.symbol] && (
                                  <Badge 
                                    variant={stockPrices[holding.symbol].changePercent >= 0 ? 'positive' : 'negative'}
                                    className="text-xs"
                                  >
                                    {stockPrices[holding.symbol].changePercent >= 0 ? '+' : ''}
                                    {stockPrices[holding.symbol].changePercent}%
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">未更新</span>
                            )}
                          </td>
                          <td className={`py-3 px-4 text-right font-medium ${
                            unrealizedPnL >= 0 ? 'text-positive' : 'text-negative'
                          }`}>
                            {currentPrice > 0 ? (
                              `${unrealizedPnL >= 0 ? '+' : ''}$${unrealizedPnL.toFixed(2)}`
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className={`py-3 px-4 text-right font-medium ${
                            returnRate >= 0 ? 'text-positive' : 'text-negative'
                          }`}>
                            {currentPrice > 0 ? (
                              `${returnRate >= 0 ? '+' : ''}${returnRate.toFixed(2)}%`
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleSellClick(holding)}
                            >
                              賣出
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 交易記錄 */}
        <Card>
          <CardHeader>
            <CardTitle>交易記錄</CardTitle>
          </CardHeader>
          <CardContent>
            {usTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">尚無美股交易記錄</p>
                <Button asChild>
                  <Link to="/add-transaction/us">
                    <Plus className="w-4 h-4 mr-2" />
                    新增第一筆交易
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">日期</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">股票代碼</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">公司名稱</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">動作</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">數量</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">價格</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">金額</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usTransactions
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((tx, index) => (
                        <tr key={tx.id || index} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 px-4 text-foreground">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 font-medium text-primary">
                            {tx.symbol}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {tx.stockName || tx.symbol}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge variant={tx.type === 'BUY' ? 'positive' : 'negative'}>
                              {tx.type === 'BUY' ? '買入' : '賣出'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {tx.quantity.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            ${tx.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            ${(tx.quantity * tx.price).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 快速賣出彈窗 */}
      <QuickSellModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        holding={selectedHolding}
        onSellComplete={handleSellComplete}
      />
    </div>
  );
}

export default USMarket;

