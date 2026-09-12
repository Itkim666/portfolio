import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './'：构建产物使用相对路径，可部署到任意子路径（GitHub Pages 等）
export default defineConfig({
  plugins: [react()],
  base: './',
})
