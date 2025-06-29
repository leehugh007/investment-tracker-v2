import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import USMarket from './pages/USMarket';
import TWMarket from './pages/TWMarket';
import HKMarket from './pages/HKMarket';
import JPMarket from './pages/JPMarket';
import HistoryAnalysis from './pages/HistoryAnalysis';
import TransactionForm from './components/TransactionForm';

// 導航組件
const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '🏠 首頁總覽', color: 'blue' },
    { path: '/us', label: '🇺🇸 美股', color: 'blue' },
    { path: '/tw', label: '🇹🇼 台股', color: 'green' },
    { path: '/hk', label: '🇭🇰 港股', color: 'red' },
    { path: '/jp', label: '🇯🇵 日股', color: 'yellow' },
    { path: '/history', label: '📈 歷史分析', color: 'purple' },
  ];

  const getNavItemClass = (path, color) => {
    const isActive = location.pathname === path;
    const baseClass = "px-4 py-2 rounded-lg font-medium transition-colors";
    
    if (isActive) {
      const activeColors = {
        blue: 'bg-blue-600 text-white',
        green: 'bg-green-600 text-white',
        red: 'bg-red-600 text-white',
        yellow: 'bg-yellow-600 text-white',
        purple: 'bg-purple-600 text-white'
      };
      return `${baseClass} ${activeColors[color]}`;
    } else {
      const hoverColors = {
        blue: 'text-blue-600 hover:bg-blue-50',
        green: 'text-green-600 hover:bg-green-50',
        red: 'text-red-600 hover:bg-red-50',
        yellow: 'text-yellow-600 hover:bg-yellow-50',
        purple: 'text-purple-600 hover:bg-purple-50'
      };
      return `${baseClass} text-gray-600 hover:text-gray-900 ${hoverColors[color]}`;
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <span className="text-xl font-bold text-gray-900">投資追蹤系統</span>
          </Link>

          {/* 導航選單 */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={getNavItemClass(item.path, item.color)}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* 新增交易按鈕 */}
          <Link
            to="/add-transaction"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            ➕ 新增交易
          </Link>
        </div>

        {/* 手機版導航 */}
        <div className="md:hidden pb-4">
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${getNavItemClass(item.path, item.color)} text-center text-sm`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        
        <Routes>
          {/* 首頁總覽 */}
          <Route path="/" element={<Dashboard />} />
          
          {/* 美股頁面 */}
          <Route path="/us" element={<USMarket />} />
          
          {/* 台股頁面 */}
          <Route path="/tw" element={<TWMarket />} />
          
          {/* 港股頁面 */}
          <Route path="/hk" element={<HKMarket />} />
          
          {/* 日股頁面 */}
          <Route path="/jp" element={<JPMarket />} />
          
          {/* 歷史分析頁面 */}
          <Route path="/history" element={<HistoryAnalysis />} />
          
          {/* 新增交易頁面 - 支援市場參數 */}
          <Route path="/add-transaction" element={<TransactionForm market="US" />} />
          <Route path="/add-transaction/us" element={<TransactionForm market="US" />} />
          <Route path="/add-transaction/tw" element={<TransactionForm market="TW" />} />
          <Route path="/add-transaction/hk" element={<TransactionForm market="HK" />} />
          <Route path="/add-transaction/jp" element={<TransactionForm market="JP" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

