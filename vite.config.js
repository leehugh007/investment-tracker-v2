import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 若設環境變數 BUILD_TARGET=vercel → base '/'
  // 否則預設仍給 GitHub Pages 用的子目錄
  const isVercel = process.env.BUILD_TARGET === 'vercel'
  
  return {
    plugins: [react()],
    // ⚡ 根據環境決定 base 路徑
    base: isVercel ? '/' : (command === 'serve' ? '/' : '/investment-tracker-v2/'),
    server: {
      host: '0.0.0.0',
      port: 3001,
      allowedHosts: 'all'
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            forms: ['react-hook-form']
          }
        }
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    preview: {
      port: 4173,
      host: true
    }
  }
})

