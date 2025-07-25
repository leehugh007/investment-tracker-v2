"""
Vercel Functions API for Yahoo Finance data
支援港股和日股的股票資訊查詢
"""

from http.server import BaseHTTPRequestHandler
import json
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime

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
            
            if not symbol:
                self.wfile.write(json.dumps({
                    'error': '缺少股票代號參數'
                }).encode())
                return
            
            # 根據action執行不同操作
            if action == 'info':
                result = self.get_stock_info(symbol)
            elif action == 'price':
                result = self.get_stock_price(symbol)
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
    
    def get_stock_info(self, symbol):
        """獲取股票基本資訊"""
        try:
            # 確保股票代號有正確的後綴
            if '.' not in symbol:
                if symbol.startswith('0') and symbol.isdigit():
                    # 港股：以0開頭的數字 (如 0700, 00700, 000001)
                    formatted_symbol = f"{symbol}.HK"
                elif symbol.isdigit():
                    # 日股：純數字且不以0開頭 (如 7203, 6758)
                    formatted_symbol = f"{symbol}.T"
                else:
                    formatted_symbol = symbol
            else:
                formatted_symbol = symbol
            
            # 港股特殊處理：使用Chart API獲取基本資訊
            if '.HK' in formatted_symbol:
                return self.get_hk_stock_info(formatted_symbol)
            
            # 其他市場使用原有API
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
            
        except urllib.error.HTTPError as e:
            return {'error': f'HTTP錯誤: {e.code} {e.reason}'}
        except urllib.error.URLError as e:
            return {'error': f'網路錯誤: {str(e)}'}
        except json.JSONDecodeError:
            return {'error': '無法解析API回應'}
        except Exception as e:
            return {'error': f'未知錯誤: {str(e)}'}
    
    def get_hk_stock_info(self, symbol):
        """港股專用資訊獲取"""
        try:
            # 港股代號對照表（常見股票）
            hk_stock_names = {
                '00700.HK': '騰訊控股',
                '00005.HK': '匯豐控股',
                '00939.HK': '建設銀行',
                '00941.HK': '中國移動',
                '01299.HK': '友邦保險',
                '02318.HK': '中國平安',
                '01398.HK': '工商銀行',
                '00388.HK': '香港交易所',
                '00883.HK': '中國海洋石油',
                '01810.HK': '小米集團',
                '09988.HK': '阿里巴巴',
                '03690.HK': '美團',
                '00175.HK': '吉利汽車',
                '02020.HK': '安踏體育',
                '01024.HK': '快手科技'
            }
            
            # 如果在對照表中，直接返回
            if symbol in hk_stock_names:
                return {
                    'symbol': symbol,
                    'name': hk_stock_names[symbol],
                    'industry': 'N/A',
                    'sector': 'N/A',
                    'currency': 'HKD',
                    'exchange': 'HKEX',
                    'timestamp': datetime.now().isoformat()
                }
            
            # 否則嘗試從Chart API獲取
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
            
            if data.get('chart') and data['chart'].get('result'):
                meta = data['chart']['result'][0]['meta']
                return {
                    'symbol': symbol,
                    'name': meta.get('longName', symbol.replace('.HK', '')),
                    'industry': 'N/A',
                    'sector': 'N/A', 
                    'currency': meta.get('currency', 'HKD'),
                    'exchange': 'HKEX',
                    'timestamp': datetime.now().isoformat()
                }
            
            # 如果都失敗，返回基本資訊
            return {
                'symbol': symbol,
                'name': symbol.replace('.HK', ''),
                'industry': 'N/A',
                'sector': 'N/A',
                'currency': 'HKD',
                'exchange': 'HKEX',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {'error': f'港股查詢錯誤: {str(e)}'}
    
    def get_stock_price(self, symbol):
        """獲取股票價格資訊"""
        try:
            # 確保股票代號有正確的後綴
            if '.' not in symbol:
                if symbol.startswith('0') and symbol.isdigit():
                    # 港股：以0開頭的數字 (如 0700, 00700, 000001)
                    formatted_symbol = f"{symbol}.HK"
                elif symbol.isdigit():
                    # 日股：純數字且不以0開頭 (如 7203, 6758)
                    formatted_symbol = f"{symbol}.T"
                else:
                    formatted_symbol = symbol
            else:
                formatted_symbol = symbol
            
            # 調用Yahoo Finance Chart API
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
            
        except urllib.error.HTTPError as e:
            return {'error': f'HTTP錯誤: {e.code} {e.reason}'}
        except urllib.error.URLError as e:
            return {'error': f'網路錯誤: {str(e)}'}
        except json.JSONDecodeError:
            return {'error': '無法解析API回應'}
        except Exception as e:
            return {'error': f'未知錯誤: {str(e)}'}

