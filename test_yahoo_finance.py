#!/usr/bin/env python3
"""
Yahoo Finance API 測試腳本
測試港股和日股的資料獲取功能
"""

import yfinance as yf
import pandas as pd
import json
from datetime import datetime

def test_ticker(symbol, market_name):
    """測試單一股票代號"""
    print(f"\n{'='*60}")
    print(f"測試 {market_name}: {symbol}")
    print(f"{'='*60}")
    
    try:
        # 創建Ticker物件
        ticker = yf.Ticker(symbol)
        
        # 測試基本資訊
        print("📊 獲取基本資訊...")
        info = ticker.info
        
        if info:
            print(f"✅ 公司名稱: {info.get('longName', '未知')}")
            print(f"✅ 簡稱: {info.get('shortName', '未知')}")
            print(f"✅ 當前價格: {info.get('currentPrice', '未知')}")
            print(f"✅ 貨幣: {info.get('currency', '未知')}")
            print(f"✅ 市場: {info.get('market', '未知')}")
            print(f"✅ 交易所: {info.get('exchange', '未知')}")
            print(f"✅ 產業: {info.get('industry', '未知')}")
            print(f"✅ 部門: {info.get('sector', '未知')}")
        else:
            print("❌ 無法獲取基本資訊")
            return False
        
        # 測試快速資訊
        print("\n⚡ 獲取快速資訊...")
        try:
            fast_info = ticker.fast_info
            print(f"✅ 最後價格: {fast_info.get('lastPrice', '未知')}")
            print(f"✅ 前收盤價: {fast_info.get('previousClose', '未知')}")
            print(f"✅ 開盤價: {fast_info.get('open', '未知')}")
            print(f"✅ 日高: {fast_info.get('dayHigh', '未知')}")
            print(f"✅ 日低: {fast_info.get('dayLow', '未知')}")
        except Exception as e:
            print(f"⚠️ 快速資訊獲取失敗: {e}")
        
        # 測試歷史資料
        print("\n📈 獲取歷史資料 (最近5天)...")
        try:
            history = ticker.history(period="5d")
            if not history.empty:
                print(f"✅ 歷史資料筆數: {len(history)}")
                print(f"✅ 最新收盤價: {history['Close'].iloc[-1]:.2f}")
                print(f"✅ 最新成交量: {history['Volume'].iloc[-1]:,}")
                print("✅ 最近3天資料:")
                print(history[['Open', 'High', 'Low', 'Close', 'Volume']].tail(3))
            else:
                print("❌ 無歷史資料")
        except Exception as e:
            print(f"❌ 歷史資料獲取失敗: {e}")
        
        # 測試新聞
        print("\n📰 獲取相關新聞...")
        try:
            news = ticker.news
            if news:
                print(f"✅ 新聞數量: {len(news)}")
                for i, article in enumerate(news[:2]):  # 只顯示前2則
                    print(f"  {i+1}. {article.get('title', '無標題')}")
            else:
                print("⚠️ 無相關新聞")
        except Exception as e:
            print(f"⚠️ 新聞獲取失敗: {e}")
        
        return True
        
    except Exception as e:
        print(f"❌ 測試失敗: {e}")
        return False

def main():
    """主測試函數"""
    print("🚀 Yahoo Finance API 測試開始")
    print(f"⏰ 測試時間: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 測試股票清單
    test_stocks = [
        # 港股
        ("0700.HK", "港股 - 騰訊控股"),
        ("0005.HK", "港股 - 匯豐控股"),
        ("0941.HK", "港股 - 中國移動"),
        ("2318.HK", "港股 - 中國平安"),
        
        # 日股
        ("7203.T", "日股 - 豐田汽車"),
        ("6758.T", "日股 - Sony"),
        ("9984.T", "日股 - 軟銀集團"),
        ("6861.T", "日股 - 基恩斯"),
        
        # 美股 (作為對照組)
        ("AAPL", "美股 - Apple"),
        ("MSFT", "美股 - Microsoft"),
    ]
    
    results = {}
    
    for symbol, name in test_stocks:
        success = test_ticker(symbol, name)
        results[symbol] = success
    
    # 總結報告
    print(f"\n{'='*60}")
    print("📋 測試結果總結")
    print(f"{'='*60}")
    
    success_count = sum(results.values())
    total_count = len(results)
    
    print(f"✅ 成功: {success_count}/{total_count}")
    print(f"❌ 失敗: {total_count - success_count}/{total_count}")
    print(f"📊 成功率: {success_count/total_count*100:.1f}%")
    
    print("\n詳細結果:")
    for symbol, success in results.items():
        status = "✅" if success else "❌"
        print(f"  {status} {symbol}")
    
    # 港股和日股專門分析
    hk_stocks = [k for k in results.keys() if k.endswith('.HK')]
    jp_stocks = [k for k in results.keys() if k.endswith('.T')]
    
    hk_success = sum(results[k] for k in hk_stocks)
    jp_success = sum(results[k] for k in jp_stocks)
    
    print(f"\n🇭🇰 港股成功率: {hk_success}/{len(hk_stocks)} ({hk_success/len(hk_stocks)*100:.1f}%)")
    print(f"🇯🇵 日股成功率: {jp_success}/{len(jp_stocks)} ({jp_success/len(jp_stocks)*100:.1f}%)")

if __name__ == "__main__":
    main()

