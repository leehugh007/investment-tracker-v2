#!/usr/bin/env python3
"""
Yahoo Finance API 服務
為港股和日股提供股票資訊和價格查詢
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import logging
from datetime import datetime
import traceback

# 設定日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # 允許跨域請求

def format_stock_data(ticker_obj, symbol, market):
    """格式化股票資料為統一格式"""
    try:
        # 獲取基本資訊
        info = ticker_obj.info
        fast_info = ticker_obj.fast_info
        
        # 獲取歷史資料 (最近1天)
        history = ticker_obj.history(period="1d")
        
        # 基本資料
        result = {
            'symbol': symbol,
            'market': market,
            'name': info.get('longName') or info.get('shortName', '未知'),
            'currency': info.get('currency', 'USD'),
            'exchange': info.get('exchange', '未知'),
            'industry': info.get('industry', '未知'),
            'sector': info.get('sector', '未知'),
            'timestamp': int(datetime.now().timestamp() * 1000)
        }
        
        # 價格資料
        if hasattr(fast_info, 'lastPrice') and fast_info.lastPrice:
            result.update({
                'currentPrice': fast_info.lastPrice,
                'previousClose': fast_info.previousClose,
                'open': fast_info.open,
                'dayHigh': fast_info.dayHigh,
                'dayLow': fast_info.dayLow,
                'change': fast_info.lastPrice - fast_info.previousClose if fast_info.previousClose else 0,
                'changePercent': ((fast_info.lastPrice - fast_info.previousClose) / fast_info.previousClose * 100) if fast_info.previousClose else 0
            })
        elif info.get('currentPrice'):
            current_price = info.get('currentPrice')
            previous_close = info.get('previousClose', current_price)
            result.update({
                'currentPrice': current_price,
                'previousClose': previous_close,
                'open': info.get('open', current_price),
                'dayHigh': info.get('dayHigh', current_price),
                'dayLow': info.get('dayLow', current_price),
                'change': current_price - previous_close,
                'changePercent': ((current_price - previous_close) / previous_close * 100) if previous_close else 0
            })
        elif not history.empty:
            # 使用歷史資料
            latest = history.iloc[-1]
            result.update({
                'currentPrice': latest['Close'],
                'previousClose': latest['Open'],
                'open': latest['Open'],
                'dayHigh': latest['High'],
                'dayLow': latest['Low'],
                'volume': int(latest['Volume']),
                'change': latest['Close'] - latest['Open'],
                'changePercent': ((latest['Close'] - latest['Open']) / latest['Open'] * 100) if latest['Open'] else 0
            })
        else:
            raise ValueError("無法獲取價格資料")
        
        return result
        
    except Exception as e:
        logger.error(f"格式化股票資料失敗 ({symbol}): {e}")
        raise

@app.route('/api/yahoo-finance/stock-info/<symbol>')
def get_stock_info(symbol):
    """獲取股票基本資訊"""
    try:
        logger.info(f"查詢股票資訊: {symbol}")
        
        # 判斷市場
        if symbol.endswith('.HK'):
            market = 'HK'
            clean_symbol = symbol
        elif symbol.endswith('.T'):
            market = 'JP'
            clean_symbol = symbol
        else:
            # 自動添加後綴
            if len(symbol) == 4 and symbol.isdigit():
                # 港股格式
                market = 'HK'
                clean_symbol = f"{symbol}.HK"
            elif len(symbol) == 4 and symbol.isdigit():
                # 日股格式 (需要更精確的判斷邏輯)
                market = 'JP'
                clean_symbol = f"{symbol}.T"
            else:
                return jsonify({'error': '無效的股票代號格式'}), 400
        
        # 創建 yfinance Ticker 物件
        ticker = yf.Ticker(clean_symbol)
        
        # 格式化資料
        result = format_stock_data(ticker, clean_symbol, market)
        
        logger.info(f"成功獲取股票資訊: {clean_symbol} - {result.get('name')}")
        return jsonify(result)
        
    except Exception as e:
        error_msg = f"獲取股票資訊失敗: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        return jsonify({'error': error_msg}), 500

@app.route('/api/yahoo-finance/stock-price/<symbol>')
def get_stock_price(symbol):
    """獲取股票價格資訊"""
    try:
        logger.info(f"查詢股票價格: {symbol}")
        
        # 判斷市場並標準化代號
        if symbol.endswith('.HK'):
            market = 'HK'
            clean_symbol = symbol
        elif symbol.endswith('.T'):
            market = 'JP'
            clean_symbol = symbol
        else:
            # 根據長度和格式判斷
            if len(symbol) == 4 and symbol.isdigit():
                # 預設為港股
                market = 'HK'
                clean_symbol = f"{symbol}.HK"
            else:
                return jsonify({'error': '無效的股票代號格式'}), 400
        
        # 創建 yfinance Ticker 物件
        ticker = yf.Ticker(clean_symbol)
        
        # 格式化資料
        result = format_stock_data(ticker, clean_symbol, market)
        
        logger.info(f"成功獲取股票價格: {clean_symbol} - {result.get('currentPrice')}")
        return jsonify(result)
        
    except Exception as e:
        error_msg = f"獲取股票價格失敗: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        return jsonify({'error': error_msg}), 500

@app.route('/api/yahoo-finance/batch-update', methods=['POST'])
def batch_update():
    """批次更新多個股票"""
    try:
        data = request.get_json()
        if not data or 'stocks' not in data:
            return jsonify({'error': '請提供股票清單'}), 400
        
        stocks = data['stocks']
        results = []
        errors = []
        
        logger.info(f"批次更新 {len(stocks)} 個股票")
        
        for stock_info in stocks:
            try:
                symbol = stock_info.get('symbol')
                market = stock_info.get('market', 'HK')
                
                if not symbol:
                    errors.append({'symbol': '未知', 'error': '缺少股票代號'})
                    continue
                
                # 標準化股票代號
                if market == 'HK' and not symbol.endswith('.HK'):
                    clean_symbol = f"{symbol}.HK"
                elif market == 'JP' and not symbol.endswith('.T'):
                    clean_symbol = f"{symbol}.T"
                else:
                    clean_symbol = symbol
                
                # 獲取股票資料
                ticker = yf.Ticker(clean_symbol)
                result = format_stock_data(ticker, clean_symbol, market)
                
                # 添加原始股票資訊
                result.update({
                    'originalSymbol': symbol,
                    'id': stock_info.get('id'),
                    'success': True
                })
                
                results.append(result)
                
            except Exception as e:
                error_info = {
                    'symbol': stock_info.get('symbol', '未知'),
                    'error': str(e),
                    'success': False
                }
                errors.append(error_info)
                logger.error(f"批次更新失敗 ({stock_info.get('symbol')}): {e}")
        
        response = {
            'results': results,
            'errors': errors,
            'total': len(stocks),
            'success_count': len(results),
            'error_count': len(errors),
            'timestamp': int(datetime.now().timestamp() * 1000)
        }
        
        logger.info(f"批次更新完成: {len(results)}/{len(stocks)} 成功")
        return jsonify(response)
        
    except Exception as e:
        error_msg = f"批次更新失敗: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        return jsonify({'error': error_msg}), 500

@app.route('/api/yahoo-finance/health')
def health_check():
    """健康檢查端點"""
    return jsonify({
        'status': 'healthy',
        'service': 'Yahoo Finance API',
        'timestamp': int(datetime.now().timestamp() * 1000)
    })

@app.route('/api/yahoo-finance/test/<symbol>')
def test_symbol(symbol):
    """測試股票代號"""
    try:
        logger.info(f"測試股票代號: {symbol}")
        
        # 嘗試不同的市場格式
        test_symbols = []
        
        if not ('.' in symbol):
            test_symbols = [f"{symbol}.HK", f"{symbol}.T"]
        else:
            test_symbols = [symbol]
        
        results = []
        
        for test_symbol in test_symbols:
            try:
                ticker = yf.Ticker(test_symbol)
                info = ticker.info
                
                if info and info.get('longName'):
                    market = 'HK' if test_symbol.endswith('.HK') else 'JP'
                    result = format_stock_data(ticker, test_symbol, market)
                    results.append(result)
                    
            except Exception as e:
                logger.warning(f"測試 {test_symbol} 失敗: {e}")
                continue
        
        if results:
            return jsonify({
                'found': True,
                'results': results,
                'count': len(results)
            })
        else:
            return jsonify({
                'found': False,
                'message': f'找不到股票代號 {symbol} 的資料'
            }), 404
            
    except Exception as e:
        error_msg = f"測試股票代號失敗: {str(e)}"
        logger.error(f"{error_msg}\n{traceback.format_exc()}")
        return jsonify({'error': error_msg}), 500

if __name__ == '__main__':
    logger.info("啟動 Yahoo Finance API 服務...")
    app.run(host='0.0.0.0', port=5001, debug=True)

