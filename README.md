# 投資追蹤系統 v2.0

一個現代化的個人投資組合追蹤應用，支援多市場投資管理和自動股價更新。

## ✨ 功能特色

### 📊 多市場支援
- 🇺🇸 **美股** - Finnhub API 自動更新股價
- 🇹🇼 **台股** - FinMind API 自動更新股價  
- 🇭🇰 **港股** - 手動輸入價格
- 🇯🇵 **日股** - 手動輸入價格

### 💼 投資管理
- ✅ 買賣交易記錄
- ✅ FIFO 成本計算
- ✅ 持股統計和損益分析
- ✅ 快速賣出功能
- ✅ 歷史分析和篩選

### 🔧 系統功能
- ✅ React Hook Form 表單驗證
- ✅ 統一的 localStorage 服務層
- ✅ JSON 數據備份和恢復
- ✅ 響應式設計（桌面/手機）
- ✅ 多主題支援

## 🚀 技術棧

- **前端框架**: React 19.1.0
- **構建工具**: Vite 6.3.5
- **路由**: React Router DOM 7.1.1
- **表單**: React Hook Form 7.54.2
- **樣式**: Tailwind CSS 3.5.7
- **圖表**: Recharts 2.15.0
- **圖標**: Lucide React 0.460.0

## 📦 安裝和運行

### 環境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 本地開發
```bash
# 克隆項目
git clone <repository-url>
cd investment-tracker-v2

# 安裝依賴
npm install

# 啟動開發服務器
npm run dev

# 在瀏覽器中打開 http://localhost:3000
```

### 構建和部署
```bash
# 生產構建
npm run build

# 預覽構建結果
npm run preview

# 部署到生產環境
npm run deploy
```

## 🏗️ 項目結構

```
src/
├── components/          # React 組件
│   ├── BackupManager.jsx      # 備份管理
│   ├── QuickSellModal.jsx     # 快速賣出彈窗
│   ├── StockNameLookup.jsx    # 股票名稱查詢
│   ├── StockPriceUpdater.jsx  # 股價更新器
│   └── TransactionForm.jsx    # 交易表單
├── hooks/              # 自定義 Hooks
│   └── useLocalStore.js       # localStorage 服務層
├── pages/              # 頁面組件
│   ├── Dashboard.jsx          # 首頁總覽
│   ├── USMarket.jsx          # 美股頁面
│   ├── TWMarket.jsx          # 台股頁面
│   ├── HKMarket.jsx          # 港股頁面
│   ├── JPMarket.jsx          # 日股頁面
│   ├── HistoryAnalysis.jsx   # 歷史分析
│   └── Settings.jsx          # 系統設定
├── utils/              # 工具函數
│   ├── backup.js             # 備份功能
│   ├── holdingsCalculator.js # 持股計算
│   └── unifiedPnLCalculator.js # 損益計算
├── App.jsx             # 主應用組件
└── main.jsx           # 應用入口
```

## 🔧 配置文件

### Vite 配置 (`vite.config.js`)
- 基礎路徑設定為相對路徑 (`./`)
- 優化的構建配置和代碼分割
- 開發服務器配置

### 部署配置
- **Vercel**: `vercel.json` - SPA 路由重定向
- **Netlify**: `public/_redirects` - 客戶端路由支援
- **Apache**: `public/.htaccess` - 服務器重寫規則

### GitHub Actions
- **生產部署**: `.github/workflows/deploy.yml`
- **預發布環境**: `.github/workflows/staging.yml`

## 📱 功能說明

### 交易管理
1. **新增交易**: 支援買入/賣出記錄
2. **自動計算**: FIFO 成本計算和損益分析
3. **持股統計**: 實時顯示持股數量和平均成本
4. **快速操作**: 一鍵賣出功能

### 數據管理
1. **本地存儲**: 所有數據存儲在瀏覽器本地
2. **備份功能**: JSON 格式數據匯出/匯入
3. **數據驗證**: 完整的數據格式驗證
4. **安全操作**: 危險操作需要二次確認

### 股價更新
1. **API 整合**: 美股和台股自動更新
2. **緩存機制**: 避免頻繁 API 調用
3. **手動輸入**: 港股和日股支援手動價格
4. **錯誤處理**: 完善的 API 錯誤處理

## 🌐 部署環境

### 生產環境
- **GitHub Pages**: 主要部署平台
- **自動部署**: 推送到 main 分支自動部署
- **域名**: `https://username.github.io/investment-tracker-v2/`

### 預發布環境
- **功能分支**: 自動部署到 staging 子目錄
- **測試環境**: `https://username.github.io/investment-tracker-v2/staging/`
- **PR 預覽**: Pull Request 自動生成預覽鏈接

### 開發環境
- **Manus Space**: 快速測試和驗證
- **本地開發**: Vite 開發服務器
- **熱重載**: 實時代碼更新

## 🔒 數據安全

- **本地存儲**: 數據不會上傳到服務器
- **備份加密**: 建議加密存儲備份文件
- **隱私保護**: 不收集任何個人數據
- **離線使用**: 完全支援離線操作

## 📄 許可證

本項目僅供個人使用，不得用於商業用途。

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request 來改進這個項目。

## 📞 支援

如有問題或建議，請通過 GitHub Issues 聯繫。

