"""
統一的Vercel Functions API for 股票資訊查詢
整合港股和日股的智能格式化解決方案
"""

import json
import requests
import time
from urllib.parse import parse_qs

def smart_format_hk_symbol(symbol):
    """
    智能格式化港股代號
    基於成功測試的最佳實踐
    """
    symbol = str(symbol).strip().upper()
    
    # 移除現有的.HK後綴
    if symbol.endswith('.HK'):
        base_symbol = symbol[:-3]
    else:
        base_symbol = symbol
    
    # 確保是4位數字格式（港股最佳實踐）
    if base_symbol.isdigit():
        base_symbol = base_symbol.zfill(4)
    
    # 按優先級返回格式（基於測試結果）
    return [
        f"{base_symbol}.HK",     # 4位格式 - 最高成功率
        f"{base_symbol[1:]}.HK" if base_symbol.startswith('0') and len(base_symbol) > 1 else None,  # 去掉前導0
        f"0{base_symbol}.HK" if not base_symbol.startswith('0') and len(base_symbol) < 4 else None,  # 添加前導0
    ]

def smart_format_jp_symbol(symbol):
    """
    智能格式化日股代號
    基於港股成功經驗優化
    """
    symbol = str(symbol).strip().upper()
    
    # 移除現有後綴
    if symbol.endswith('.T'):
        base_symbol = symbol[:-2]
    elif symbol.endswith('.TO'):
        base_symbol = symbol[:-3]
    elif symbol.endswith('.JP'):
        base_symbol = symbol[:-3]
    else:
        base_symbol = symbol
    
    # 確保是4位數字格式（日股標準）
    if base_symbol.isdigit():
        base_symbol = base_symbol.zfill(4)
    
    # 按優先級返回格式
    return [
        f"{base_symbol}.T",      # 東京證券交易所格式（最常用）
        f"{base_symbol}",        # 純數字格式
        f"{base_symbol}.TO",     # Tokyo格式
        f"TYO:{base_symbol}",    # TYO前綴格式
        f"{base_symbol}.JP",     # Japan格式
        f"TSE:{base_symbol}",    # TSE前綴格式
    ]

def get_stock_info_with_retry(symbol_formats, original_symbol):
    """
    使用多格式重試獲取股票資訊
    """
    for fmt in symbol_formats:
        if fmt is None:  # 跳過無效格式
            continue
            
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{fmt}"
            response = requests.get(url, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if 'chart' in data and data['chart']['result']:
                    result = data['chart']['result'][0]
                    meta = result.get('meta', {})
                    
                    company_name = meta.get('longName') or meta.get('shortName')
                    current_price = meta.get('regularMarketPrice')
                    currency = meta.get('currency', 'USD')
                    
                    if company_name and current_price is not None:
                        return {
                            'success': True,
                            'symbol': fmt,
                            'company_name': company_name,
                            'price': current_price,
                            'currency': currency,
                            'format_used': fmt
                        }
            
            # 添加小延遲避免API限制
            time.sleep(0.1)
            
        except Exception as e:
            continue
    
    return {
        'success': False,
        'error': f'找不到該股票代號',
        'original_symbol': original_symbol
    }

def determine_market(symbol):
    """
    智能判斷股票市場
    """
    symbol = str(symbol).strip().upper()
    
    # 移除後綴進行判斷
    base_symbol = symbol
    if '.' in symbol:
        base_symbol = symbol.split('.')[0]
    if ':' in symbol:
        base_symbol = symbol.split(':')[1]
    
    # 港股判斷邏輯
    if symbol.endswith('.HK') or symbol.startswith('HK:'):
        return 'hk'
    
    # 日股判斷邏輯
    if (symbol.endswith('.T') or symbol.endswith('.TO') or symbol.endswith('.JP') or 
        symbol.startswith('TYO:') or symbol.startswith('TSE:')):
        return 'jp'
    
    # 基於數字模式判斷
    if base_symbol.isdigit():
        # 港股通常以0開頭或者是4位數字
        if base_symbol.startswith('0') or (len(base_symbol) == 4 and int(base_symbol) >= 1000):
            return 'hk'
        # 日股通常是4位數字
        elif len(base_symbol) == 4:
            return 'jp'
        # 較短的數字更可能是日股
        elif len(base_symbol) < 4:
            return 'jp'
    
    # 默認返回未知
    return 'unknown'

def handler(request):
    """
    Vercel Functions 處理器
    """
    try:
        # 解析查詢參數
        query_string = request.get('query', '')
        params = parse_qs(query_string)
        
        symbol = params.get('symbol', [''])[0]
        market = params.get('market', [''])[0]
        action = params.get('action', ['info'])[0]
        
        if not symbol:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': '缺少股票代號參數'})
            }
        
        # 如果沒有指定市場，自動判斷
        if not market:
            market = determine_market(symbol)
        
        # 根據市場選擇格式化策略
        if market == 'hk':
            symbol_formats = smart_format_hk_symbol(symbol)
        elif market == 'jp':
            symbol_formats = smart_format_jp_symbol(symbol)
        else:
            # 未知市場，嘗試兩種格式
            hk_formats = smart_format_hk_symbol(symbol)
            jp_formats = smart_format_jp_symbol(symbol)
            symbol_formats = hk_formats + jp_formats
        
        # 獲取股票資訊
        result = get_stock_info_with_retry(symbol_formats, symbol)
        
        if result['success']:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'symbol': result['symbol'],
                    'company_name': result['company_name'],
                    'price': result['price'],
                    'currency': result['currency'],
                    'market': market,
                    'format_used': result['format_used']
                })
            }
        else:
            return {
                'statusCode': 404,
                'body': json.dumps({
                    'error': result['error'],
                    'original_symbol': symbol,
                    'market': market
                })
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'伺服器錯誤: {str(e)}'})
        }

# Vercel Functions 入口點
def main(request):
    return handler(request)

