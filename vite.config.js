import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 給 Vercel 專用的配置，base 一律用根目錄
export default defineConfig({
  plugins: [react()],
  base: '/',  // ←←← 這是關鍵！Vercel/Netlify都該這樣
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
})
