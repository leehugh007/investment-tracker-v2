import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const TestUI = () => {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 標題區域 */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-neutral-900">UI 測試頁面 - v2</h1>
          <p className="text-lg text-neutral-600">驗證 v1 → v2 改動是否成功</p>
        </div>

        {/* 色彩測試區域 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>🎨 色彩系統測試</CardTitle>
            <CardDescription>驗證現有色彩和新色彩是否正常工作</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* 現有色彩測試 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">現有色彩（應該保持不變）</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-primary-500 text-white rounded-lg text-center">
                  <div className="font-bold">Primary 500</div>
                  <div className="text-sm opacity-90">#3b82f6</div>
                </div>
                <div className="p-4 bg-primary-600 text-white rounded-lg text-center">
                  <div className="font-bold">Primary 600</div>
                  <div className="text-sm opacity-90">#2563eb</div>
                </div>
                <div className="p-4 bg-neutral-200 text-neutral-800 rounded-lg text-center">
                  <div className="font-bold">Neutral 200</div>
                  <div className="text-sm opacity-90">#e5e7eb</div>
                </div>
                <div className="p-4 bg-neutral-500 text-white rounded-lg text-center">
                  <div className="font-bold">Neutral 500</div>
                  <div className="text-sm opacity-90">#6b7280</div>
                </div>
              </div>
            </div>

            {/* 新色彩測試 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">新色彩（v2 新增）</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-success-500 text-white rounded-lg text-center">
                  <div className="font-bold">Success 500</div>
                  <div className="text-sm opacity-90">#22c55e</div>
                </div>
                <div className="p-4 bg-warning-500 text-white rounded-lg text-center">
                  <div className="font-bold">Warning 500</div>
                  <div className="text-sm opacity-90">#f59e0b</div>
                </div>
                <div className="p-4 bg-info-500 text-white rounded-lg text-center">
                  <div className="font-bold">Info 500</div>
                  <div className="text-sm opacity-90">#0ea5e9</div>
                </div>
                <div className="p-4 bg-negative-500 text-white rounded-lg text-center">
                  <div className="font-bold">Negative 500</div>
                  <div className="text-sm opacity-90">#ef4444</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 按鈕測試區域 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>🔘 按鈕元件測試</CardTitle>
            <CardDescription>驗證按鈕樣式和互動效果</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* 現有按鈕變體 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">現有按鈕變體</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Default Button</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button variant="positive">Positive</Button>
              </div>
            </div>

            {/* 按鈕尺寸 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">按鈕尺寸</h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">🔍</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 陰影測試區域 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>🌫️ 陰影系統測試</CardTitle>
            <CardDescription>驗證新的陰影系統</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-white rounded-lg shadow-xs border">
                <h4 className="font-semibold mb-2">Shadow XS</h4>
                <p className="text-sm text-neutral-600">最輕微的陰影</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-sm border">
                <h4 className="font-semibold mb-2">Shadow SM</h4>
                <p className="text-sm text-neutral-600">小陰影</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-md border">
                <h4 className="font-semibold mb-2">Shadow MD</h4>
                <p className="text-sm text-neutral-600">中等陰影</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-lg border">
                <h4 className="font-semibold mb-2">Shadow LG</h4>
                <p className="text-sm text-neutral-600">大陰影</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-xl border">
                <h4 className="font-semibold mb-2">Shadow XL</h4>
                <p className="text-sm text-neutral-600">超大陰影</p>
              </div>
              <div className="p-6 bg-white rounded-lg shadow-2xl border">
                <h4 className="font-semibold mb-2">Shadow 2XL</h4>
                <p className="text-sm text-neutral-600">最大陰影</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 字體測試區域 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>📝 字體系統測試</CardTitle>
            <CardDescription>驗證優化的字體大小和行高</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-xs">文字大小 XS (0.75rem) - 小字體</div>
            <div className="text-sm">文字大小 SM (0.875rem) - 小字體</div>
            <div className="text-base">文字大小 Base (1rem) - 基礎字體</div>
            <div className="text-lg">文字大小 LG (1.125rem) - 大字體</div>
            <div className="text-xl">文字大小 XL (1.25rem) - 特大字體</div>
            <div className="text-2xl">文字大小 2XL (1.5rem) - 標題字體</div>
            <div className="text-3xl">文字大小 3XL (1.875rem) - 大標題</div>
            <div className="text-4xl">文字大小 4XL (2.25rem) - 超大標題</div>
          </CardContent>
        </Card>

        {/* 圓角測試區域 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>🔲 圓角系統測試</CardTitle>
            <CardDescription>驗證新的圓角系統</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-primary-100 rounded-xs text-center">
                <div className="font-semibold">XS</div>
                <div className="text-xs text-neutral-600">0.25rem</div>
              </div>
              <div className="p-4 bg-primary-100 rounded-sm text-center">
                <div className="font-semibold">SM</div>
                <div className="text-xs text-neutral-600">0.375rem</div>
              </div>
              <div className="p-4 bg-primary-100 rounded-md text-center">
                <div className="font-semibold">MD</div>
                <div className="text-xs text-neutral-600">0.5rem</div>
              </div>
              <div className="p-4 bg-primary-100 rounded-lg text-center">
                <div className="font-semibold">LG</div>
                <div className="text-xs text-neutral-600">0.75rem</div>
              </div>
              <div className="p-4 bg-primary-100 rounded-xl text-center">
                <div className="font-semibold">XL</div>
                <div className="text-xs text-neutral-600">1rem</div>
              </div>
              <div className="p-4 bg-primary-100 rounded-2xl text-center">
                <div className="font-semibold">2XL</div>
                <div className="text-xs text-neutral-600">1.5rem</div>
              </div>
              <div className="p-4 bg-primary-100 rounded-3xl text-center">
                <div className="font-semibold">3XL</div>
                <div className="text-xs text-neutral-600">2rem</div>
              </div>
              <div className="p-4 bg-primary-100 rounded-full text-center">
                <div className="font-semibold">Full</div>
                <div className="text-xs text-neutral-600">9999px</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 功能測試區域 */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>✅ 功能測試</CardTitle>
            <CardDescription>驗證現有功能是否正常</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">✅ 測試項目</h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• 所有現有色彩保持不變</li>
                <li>• 新色彩正常顯示</li>
                <li>• 按鈕元件正常工作</li>
                <li>• 陰影系統正常</li>
                <li>• 字體系統正常</li>
                <li>• 圓角系統正常</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📋 檢查清單</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 頁面載入正常</li>
                <li>• 沒有 JavaScript 錯誤</li>
                <li>• 響應式設計正常</li>
                <li>• 所有互動元素可點擊</li>
                <li>• 色彩對比度良好</li>
              </ul>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default TestUI; 