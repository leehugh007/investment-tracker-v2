import React from 'react';
import TopBar from './TopBar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <TopBar />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-neutral-500">
            <p>© 2025 投資追蹤系統. 專業的個人投資管理工具.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

