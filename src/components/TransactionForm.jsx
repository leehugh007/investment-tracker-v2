import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react';
import StockNameLookup from './StockNameLookup';
import { 
  validateSellTransaction, 
  createEnhancedTransaction,
  calculateHoldings,
  processSellTransaction
} from '../utils/holdingsCalculator';
import { transactionService } from '../hooks/useLocalStore';
import { 
  Button, 
  Input, 
  Label, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge 
} from './ui';

const TransactionForm = ({ market }) => {
  const navigate = useNavigate();
  const [stockInfo, setStockInfo] = useState(null);
  const [holdings, setHoldings] = useState(null);
  const [sellValidation, setSellValidation] = useState(null);

  const marketConfig = {
    US: { currency: 'USD', placeholder: 'AAPL', name: '美股', flag: '🇺🇸' },
    TW: { currency: 'TWD', placeholder: '2330', name: '台股', flag: '🇹🇼' },
    HK: { currency: 'HKD', placeholder: '0700', name: '港股', flag: '🇭🇰' },
    JP: { currency: 'JPY', placeholder: '7203', name: '日股', flag: '🇯🇵' }
  };

  const config = marketConfig[market] || marketConfig.US;

  // React Hook Form 設置
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      symbol: '',
      stockName: '',
      type: 'BUY',
      quantity: '',
      price: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  // 監聽表單變化
  const watchedSymbol = watch('symbol');
  const watchedType = watch('type');
  const watchedQuantity = watch('quantity');

  // 檢查持股狀況（當股票代碼或交易類型改變時）
  useEffect(() => {
    if (watchedSymbol && watchedType === 'SELL') {
      // 使用新的服務層獲取交易記錄
      const existingTransactions = transactionService.getAll();
      const currentHoldings = calculateHoldings(watchedSymbol.toUpperCase(), existingTransactions);
      setHoldings(currentHoldings);
      
      // 如果有輸入數量，立即驗證
      if (watchedQuantity) {
        const validation = validateSellTransaction(
          watchedSymbol.toUpperCase(), 
          parseInt(watchedQuantity), 
          existingTransactions
        );
        setSellValidation(validation);
      } else {
        setSellValidation(null);
      }
    } else {
      setHoldings(null);
      setSellValidation(null);
    }
  }, [watchedSymbol, watchedType, watchedQuantity]);

  // 表單提交處理
  const onSubmit = async (data) => {
    try {
      // 使用新的服務層獲取現有交易
      const existingTransactions = transactionService.getAll();
      
      // 準備交易資料
      const transactionData = {
        symbol: data.symbol.toUpperCase(),
        stockName: (market === 'HK' || market === 'JP') 
          ? (data.stockName || data.symbol.toUpperCase())
          : (stockInfo?.name || data.symbol.toUpperCase()),
        market,
        type: data.type,
        quantity: parseInt(data.quantity),
        price: parseFloat(data.price),
        date: data.date,
        currency: config.currency
      };

      // 如果是賣出交易，需要先處理FIFO配對
      if (data.type === 'SELL') {
        const sellResult = processSellTransaction(
          data.symbol.toUpperCase(),
          parseInt(data.quantity),
          existingTransactions
        );
        
        if (!sellResult.success) {
          throw new Error(sellResult.error);
        }
        
        // 批量更新交易記錄（包含FIFO配對的更新）
        const success = transactionService.updateBatch(sellResult.updatedTransactions);
        if (!success) {
          throw new Error('更新交易記錄失敗');
        }
        
        // 創建並添加賣出交易
        const enhancedTransaction = createEnhancedTransaction(transactionData, sellResult.updatedTransactions);
        const newTransaction = transactionService.add(enhancedTransaction);
        
        if (!newTransaction) {
          throw new Error('保存賣出交易失敗');
        }
      } else {
        // 買入交易直接添加
        const enhancedTransaction = createEnhancedTransaction(transactionData, existingTransactions);
        const newTransaction = transactionService.add(enhancedTransaction);
        
        if (!newTransaction) {
          throw new Error('保存買入交易失敗');
        }
      }

      // 重置表單
      reset();
      setStockInfo(null);
      setHoldings(null);
      setSellValidation(null);

      alert(`${config.name}交易記錄已成功新增！`);
      
    } catch (error) {
      console.error('交易提交失敗:', error);
      alert(`提交失敗: ${error.message}`);
    }
  };

  // 自定義驗證規則
  const validationRules = {
    symbol: {
      required: '請輸入股票代碼',
      pattern: {
        value: /^[A-Za-z0-9]+$/,
        message: '股票代碼只能包含字母和數字'
      }
    },
    quantity: {
      required: '請輸入數量',
      min: {
        value: 1,
        message: '數量必須大於0'
      },
      validate: (value) => {
        if (watchedType === 'SELL' && holdings && !holdings.canSell) {
          return `您目前沒有持有 ${watchedSymbol.toUpperCase()} 股票`;
        }
        if (watchedType === 'SELL' && holdings && parseInt(value) > holdings.totalQuantity) {
          return `賣出數量 (${value}) 超過持有數量 (${holdings.totalQuantity})`;
        }
        return true;
      }
    },
    price: {
      required: '請輸入價格',
      min: {
        value: 0.01,
        message: '價格必須大於0'
      }
    },
    date: {
      required: '請選擇交易日期'
    }
  };

  const handleStockInfoChange = (info) => {
    setStockInfo(info);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* 頁面標題 */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 -ml-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            新增{config.name}交易記錄
          </h1>
          <p className="text-muted-foreground">記錄您的買賣交易，系統將自動計算損益</p>
        </div>

        {/* 交易表單 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>交易資訊</span>
              <Badge variant="outline">
                {config.flag} {config.name} ({config.currency})
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 市場資訊 */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Info className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        投資市場: {config.flag} {config.name} ({config.currency})
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {market === 'US' || market === 'TW' ? 'API自動更新' : '手動輸入價格'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* 股票代碼輸入 */}
              <div className="space-y-2">
                <Label htmlFor="symbol">股票代碼 *</Label>
                <Input
                  id="symbol"
                  type="text"
                  {...register('symbol', validationRules.symbol)}
                  placeholder={`例如: ${config.placeholder}`}
                  className={errors.symbol ? 'border-destructive' : ''}
                />
                {errors.symbol && (
                  <p className="text-sm text-destructive">{errors.symbol.message}</p>
                )}
                
                {/* 股票名稱自動顯示或手動輸入 */}
                {(market === 'US' || market === 'TW') ? (
                  <StockNameLookup 
                    symbol={watchedSymbol}
                    market={market}
                    onStockInfoChange={handleStockInfoChange}
                    className="mt-2"
                  />
                ) : (
                  <div className="mt-2">
                    <Label htmlFor="stockName">公司名稱 *</Label>
                    <Input
                      id="stockName"
                      placeholder="請輸入公司名稱（如：騰訊控股、豐田汽車）"
                      {...register('stockName', { 
                        required: '請輸入公司名稱' 
                      })}
                      className="mt-1"
                    />
                    {errors.stockName && (
                      <p className="text-sm text-destructive mt-1">{errors.stockName.message}</p>
                    )}
                  </div>
                )}
              </div>

              {/* 交易類型 */}
              <div className="space-y-3">
                <Label>交易類型 *</Label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value="BUY"
                      {...register('type')}
                      className="sr-only"
                    />
                    <div className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                      watchedType === 'BUY' 
                        ? 'border-positive bg-positive/10 text-positive' 
                        : 'border-border hover:border-positive/50'
                    }`}>
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">買入</span>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value="SELL"
                      {...register('type')}
                      className="sr-only"
                    />
                    <div className={`flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                      watchedType === 'SELL' 
                        ? 'border-negative bg-negative/10 text-negative' 
                        : 'border-border hover:border-negative/50'
                    }`}>
                      <TrendingDown className="w-4 h-4" />
                      <span className="font-medium">賣出</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 持股資訊顯示（僅賣出時） */}
              {watchedType === 'SELL' && watchedSymbol && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-amber-800 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      持股資訊
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {holdings ? (
                      holdings.canSell ? (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-amber-700">目前持股:</span>
                            <span className="font-medium text-amber-900">
                              {holdings.totalQuantity} 股
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-700">平均成本:</span>
                            <span className="font-medium text-amber-900">
                              {holdings.averageCost} {config.currency}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-700">總成本:</span>
                            <span className="font-medium text-amber-900">
                              {holdings.totalCost.toLocaleString()} {config.currency}
                            </span>
                          </div>
                          {sellValidation && !sellValidation.isValid && (
                            <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                              <div className="flex items-center text-destructive text-sm">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                {sellValidation.error}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-destructive">
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          您目前沒有持有 {watchedSymbol.toUpperCase()} 股票
                        </div>
                      )
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        正在檢查持股狀況...
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 數量和價格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="quantity">數量 (股) *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    {...register('quantity', validationRules.quantity)}
                    placeholder="100"
                    min="1"
                    className={errors.quantity ? 'border-destructive' : ''}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">{errors.quantity.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">價格 ({config.currency}) *</Label>
                  <Input
                    id="price"
                    type="number"
                    {...register('price', validationRules.price)}
                    placeholder={market === 'US' ? '150.50' : '600'}
                    step="0.01"
                    min="0.01"
                    className={errors.price ? 'border-destructive' : ''}
                  />
                  {errors.price && (
                    <p className="text-sm text-destructive">{errors.price.message}</p>
                  )}
                </div>
              </div>

              {/* 交易日期 */}
              <div className="space-y-2">
                <Label htmlFor="date">交易日期 *</Label>
                <Input
                  id="date"
                  type="date"
                  {...register('date', validationRules.date)}
                  className={errors.date ? 'border-destructive' : ''}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>

              {/* 交易摘要 */}
              {watchedSymbol && watch('quantity') && watch('price') && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">交易摘要</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">市場:</span>
                        <span>{config.flag} {config.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">股票:</span>
                        <span>
                          {watchedSymbol.toUpperCase()}
                          {stockInfo && (
                            <span className="text-muted-foreground ml-1">
                              - {stockInfo.name}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">動作:</span>
                        <Badge variant={watchedType === 'BUY' ? 'positive' : 'negative'}>
                          {watchedType === 'BUY' ? '買入' : '賣出'}
                        </Badge>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span className="text-muted-foreground">總金額:</span>
                        <span>
                          {(watch('quantity') * watch('price')).toLocaleString()} {config.currency}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 提交按鈕 */}
              <div className="flex space-x-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                  size="lg"
                >
                  {isSubmitting ? '處理中...' : `新增${config.name}交易記錄`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  size="lg"
                >
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionForm;

