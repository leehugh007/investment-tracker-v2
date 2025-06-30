import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, TrendingUp, Plus, Settings, BarChart3, 
  Menu, X 
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: '總覽', desc: '投資組合概況' },
  { to: '/us', icon: TrendingUp, label: '美股', desc: '美股投資' },
  { to: '/tw', icon: TrendingUp, label: '台股', desc: '台股投資' },
  { to: '/hk', icon: TrendingUp, label: '港股', desc: '港股投資' },
  { to: '/jp', icon: TrendingUp, label: '日股', desc: '日股投資' },
  { to: '/history', icon: BarChart3, label: '分析', desc: '歷史分析' },
  { to: '/settings', icon: Settings, label: '設定', desc: '系統設定' },
];
const QUICK_ACTIONS = [
  { to: '/add-transaction', icon: Plus, label: '新增交易' }
];

const TopBar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 border-b border-neutral-200 backdrop-blur">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo & Title */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-blue-700 flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:block text-lg font-bold tracking-wide text-neutral-900">投資追蹤系統</span>
          </Link>

          {/* Navigation: Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-xl text-[15px] font-medium transition
                  ${isActive(to)
                    ? 'bg-primary-100 text-primary-700 shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-primary-800'}
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Quick Action(s) */}
          <div className="flex items-center gap-2">
            {QUICK_ACTIONS.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-primary-600 to-blue-700 text-white font-semibold shadow hover:from-primary-700 hover:to-blue-800 transition"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            ))}

            {/* Mobile Hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-neutral-100 transition"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="開啟選單"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden mt-2 bg-white border rounded-xl shadow-lg p-3 animate-fade-in">
            <nav className="space-y-1">
              {NAV_ITEMS.map(({ to, icon: Icon, label, desc }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg text-[15px] font-medium transition
                    ${isActive(to)
                      ? 'bg-primary-100 text-primary-700 border-l-4 border-primary-500'
                      : 'text-neutral-700 hover:bg-neutral-50'}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <div>
                    <div>{label}</div>
                    <div className="text-xs text-neutral-400">{desc}</div>
                  </div>
                </Link>
              ))}
              {/* Mobile quick actions */}
              {QUICK_ACTIONS.map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 mt-2 rounded-lg bg-gradient-to-br from-primary-600 to-blue-700 text-white font-semibold shadow hover:from-primary-700 hover:to-blue-800 transition"
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;