import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  Plus, 
  Settings, 
  BarChart3,
  Menu,
  X,
  TestTube
} from 'lucide-react';
import { useState } from 'react';

const TopBar = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { 
      to: '/', 
      icon: Home, 
      label: '總覽',
      description: '投資組合概況'
    },
    { 
      to: '/us', 
      icon: TrendingUp, 
      label: '美股',
      description: '美股投資'
    },
    { 
      to: '/tw', 
      icon: TrendingUp, 
      label: '台股',
      description: '台股投資'
    },
    { 
      to: '/hk', 
      icon: TrendingUp, 
      label: '港股',
      description: '港股投資'
    },
    { 
      to: '/jp', 
      icon: TrendingUp, 
      label: '日股',
      description: '日股投資'
    },
    { 
      to: '/history', 
      icon: BarChart3, 
      label: '分析',
      description: '歷史分析'
    },
    { 
      to: '/settings', 
      icon: Settings, 
      label: '設定',
      description: '系統設定'
    },
    { 
      to: '/test-ui', 
      icon: TestTube, 
      label: '測試',
      description: 'UI 測試頁面'
    },
  ];

  const quickActions = [
    {
      to: '/add-transaction',
      icon: Plus,
      label: '新增交易',
      variant: 'primary'
    }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-xl font-bold text-neutral-900 hover:text-primary-600 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:block">投資追蹤系統</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${active 
                      ? 'bg-primary-50 text-primary-700 shadow-sm' 
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                    }
                  `}
                  title={item.description}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className={`
                    inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${action.variant === 'primary'
                      ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:block">{action.label}</span>
                </Link>
              );
            })}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
              aria-label="開啟選單"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 py-4">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200
                      ${active 
                        ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600' 
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <div>{item.label}</div>
                      <div className="text-xs text-neutral-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;

