import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';

// 頁面組件
import Dashboard from './pages/Dashboard';
import USMarket from './pages/USMarket';
import TWMarket from './pages/TWMarket';
import HKMarket from './pages/HKMarket';
import JPMarket from './pages/JPMarket';
import HistoryAnalysis from './pages/HistoryAnalysis';
import Settings from './pages/Settings';
import TransactionForm from './components/TransactionForm';

// 樣式
import './index.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* 首頁儀表板 */}
          <Route path="/" element={<Dashboard />} />
          
          {/* 各市場頁面 */}
          <Route path="/us" element={<USMarket />} />
          <Route path="/tw" element={<TWMarket />} />
          <Route path="/hk" element={<HKMarket />} />
          <Route path="/jp" element={<JPMarket />} />
          
          {/* 歷史分析頁面 */}
          <Route path="/history" element={<HistoryAnalysis />} />
          
          {/* 設定頁面 */}
          <Route path="/settings" element={<Settings />} />
          
          {/* 新增交易頁面 - 支援市場參數 */}
          <Route path="/add-transaction" element={<TransactionForm market="US" />} />
          <Route path="/add-transaction/us" element={<TransactionForm market="US" />} />
          <Route path="/add-transaction/tw" element={<TransactionForm market="TW" />} />
          <Route path="/add-transaction/hk" element={<TransactionForm market="HK" />} />
          <Route path="/add-transaction/jp" element={<TransactionForm market="JP" />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

