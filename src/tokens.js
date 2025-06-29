/**
 * 設計Token系統
 * 統一的色彩、字體、間距規範
 */

export const colors = {
  // 主色系
  primary: '#2563eb',     // indigo-600 - 專業藍色
  primaryHover: '#1d4ed8', // indigo-700
  primaryLight: '#dbeafe', // indigo-50
  
  // 狀態色彩
  positive: '#16a34a',    // green-600 - 盈利綠
  positiveLight: '#dcfce7', // green-50
  negative: '#dc2626',    // red-600 - 虧損紅
  negativeLight: '#fef2f2', // red-50
  
  // 中性色彩
  neutral: '#6b7280',     // gray-500
  neutralBg: '#f8fafc',   // gray-50
  neutralBorder: '#e5e7eb', // gray-200
  
  // 背景色
  background: '#ffffff',
  backgroundSecondary: '#f9fafb', // gray-50
  
  // 文字色彩
  textPrimary: '#111827',   // gray-900
  textSecondary: '#6b7280', // gray-500
  textMuted: '#9ca3af',     // gray-400
};

export const typography = {
  fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

export const borderRadius = {
  sm: '0.25rem',   // 4px
  md: '0.375rem',  // 6px
  lg: '0.5rem',    // 8px
  xl: '0.75rem',   // 12px
  '2xl': '1rem',   // 16px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// 斷點系統
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// 動畫時間
export const transitions = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

// Z-index層級
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
};

