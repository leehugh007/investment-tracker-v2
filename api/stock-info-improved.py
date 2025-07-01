"""
改進的Vercel Functions API for Yahoo Finance data
支援港股和日股的股票資訊查詢，使用智能格式化
"""

from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime
import re

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 解析URL和查詢參數
        parsed_url = urllib.parse.urlparse(self.path)
        query_params = urllib.parse.parse_qs(parsed_url.query)
        
        # 設置CORS headers
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        try:
            # 獲取股票代號
            symbol = query_params.get('symbol', [''])[0]
            action = query_params.get('action', ['info'])[0]  # info 或 price
            market = query_params.get('market', ['auto'])[0]  # hk, jp, 或 auto
            
            if not symbol:
                self.wfile.write(json.dumps({
                    'error': '缺少股票代號參數'
                }).encode())
                return
            
            # 根據action執行不同操作
            if action == 'info':
                result = self.get_stock_info(symbol, market)
            elif action == 'price':
                result = self.get_stock_price(symbol, market)
            else:
                result = {'error': '無效的action參數'}
            
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            error_response = {
                'error': f'API調用失敗: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        # 處理預檢請求
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def normalize_hk_stock_symbol(self, symbol):
        """
        標準化港股代號格式
        基於測試發現：4位格式最有效
        """
        # 移除所有非數字字符
        digits = re.sub(r'[^\d]', '', str(symbol))
        
        if not digits:
            raise ValueError(f"無效的股票代號: {symbol}")
        
        # 轉換為整數再轉回字符串（自動移除前導0）
        stock_number = int(digits)
        
        # 格式化為4位數字（不足補0）
        formatted_number = f"{stock_number:04d}"
        
        return f"{formatted_number}.HK"
    
    def normalize_jp_stock_symbol(self, symbol):
        """
        標準化日股代號格式
        """
        # 移除所有非數字字符
        digits = re.sub(r'[^\d]', '', str(symbol))
        
        if not digits:
            raise ValueError(f"無效的股票代號: {symbol}")
        
        return f"{digits}.T"
    
    def get_formatted_symbol(self, symbol, market):
        """
        根據市場類型格式化股票代號
        """
        # 如果已經有後綴，直接返回
        if '.HK' in symbol or '.T' in symbol:
            return symbol
        
        if market == 'hk':
            return self.normalize_hk_stock_symbol(symbol)
        elif market == 'jp':
            return self.normalize_jp_stock_symbol(symbol)
        elif market == 'auto':
            # 自動判斷：先嘗試港股格式，再嘗試日股格式
            return self.normalize_hk_stock_symbol(symbol)
        else:
            return symbol
    
    def try_multiple_formats(self, symbol, market, api_call_func):
        """
        嘗試多種格式來獲取股票資料
        """
        formats_to_try = []
        
        if market == 'hk':
            formats_to_try = [self.normalize_hk_stock_symbol(symbol)]
        elif market == 'jp':
            formats_to_try = [self.normalize_jp_stock_symbol(symbol)]
        elif market == 'auto':
            # 自動模式：先嘗試港股，再嘗試日股
            formats_to_try = [
                self.normalize_hk_stock_symbol(symbol),
                self.normalize_jp_stock_symbol(symbol)
            ]
        else:
            formats_to_try = [symbol]
        
        last_error = None
        
        for formatted_symbol in formats_to_try:
            try:
                result = api_call_func(formatted_symbol)
                if not result.get('error'):
                    result['format_used'] = formatted_symbol
                    return result
                last_error = result.get('error')
            except Exception as e:
                last_error = str(e)
                continue
        
        return {
            'error': f'所有格式都無法獲取 {symbol} 的資料。最後錯誤: {last_error}',
            'formats_tried': formats_to_try
        }
    
    def call_yahoo_finance_info_api(self, formatted_symbol):
        """調用Yahoo Finance資訊API"""
        url = f"https://query1.finance.yahoo.com/v1/finance/quoteType/{formatted_symbol}"
        
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
        
        if not data.get('quoteType') or not data['quoteType'].get('result'):
            return {'error': '找不到該股票代號'}
        
        stock_info = data['quoteType']['result'][0]
        
        return {
            'symbol': stock_info.get('symbol', formatted_symbol),
            'name': stock_info.get('longName') or stock_info.get('shortName', ''),
            'industry': stock_info.get('industry', 'N/A'),
            'sector': stock_info.get('sector', 'N/A'),
            'currency': stock_info.get('currency', 'USD'),
            'exchange': stock_info.get('exchange', ''),
            'timestamp': datetime.now().isoformat()
        }
    
    def call_yahoo_finance_price_api(self, formatted_symbol):
        """調用Yahoo Finance價格API"""
        url = f"https://query1.finance.yahoo.com/v8/finance/chart/{formatted_symbol}"
        
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
        
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
        
        if not data.get('chart') or not data['chart'].get('result'):
            return {'error': '無法獲取股價數據'}
        
        result = data['chart']['result'][0]
        meta = result['meta']
        
        # 獲取最新價格
        current_price = meta.get('regularMarketPrice', 0)
        previous_close = meta.get('previousClose', 0)
        
        # 計算漲跌
        change = current_price - previous_close if current_price and previous_close else 0
        change_percent = (change / previous_close * 100) if previous_close else 0
        
        return {
            'symbol': meta.get('symbol', formatted_symbol),
            'currentPrice': current_price,
            'change': change,
            'changePercent': round(change_percent, 2),
            'high': meta.get('regularMarketDayHigh', 0),
            'low': meta.get('regularMarketDayLow', 0),
            'open': meta.get('regularMarketOpen', 0),
            'previousClose': previous_close,
            'volume': meta.get('regularMarketVolume', 0),
            'timestamp': datetime.now().isoformat()
        }
    
    def get_stock_info(self, symbol, market):
        """獲取股票基本資訊"""
        try:
            return self.try_multiple_formats(symbol, market, self.call_yahoo_finance_info_api)
        except urllib.error.HTTPError as e:
            return {'error': f'HTTP錯誤: {e.code} {e.reason}'}
        except urllib.error.URLError as e:
            return {'error': f'網路錯誤: {str(e)}'}
        except json.JSONDecodeError:
            return {'error': '無法解析API回應'}
        except Exception as e:
            return {'error': f'未知錯誤: {str(e)}'}
    
    def get_stock_price(self, symbol, market):
        """獲取股票價格資訊"""
        try:
            return self.try_multiple_formats(symbol, market, self.call_yahoo_finance_price_api)
        except urllib.error.HTTPError as e:
            return {'error': f'HTTP錯誤: {e.code} {e.reason}'}
        except urllib.error.URLError as e:
            return {'error': f'網路錯誤: {str(e)}'}
        except json.JSONDecodeError:
            return {'error': '無法解析API回應'}
        except Exception as e:
            return {'error': f'未知錯誤: {str(e)}'}

