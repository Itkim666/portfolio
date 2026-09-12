import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './'：构建产物使用相对路径，可部署到任意子路径（GitHub Pages 等）
export default defineConfig({
  plugins: [react()],
  base: './',
  // preview 用 --host 暴露到局域网/隧道时，默认的 allowedHosts 防护会拒绝外部域名。
  // 这里只对 preview 放开（构建产物本身全是公开内容，无敏感信息）。
  // 注意：这是 vite preview 的配置，不影响 dev server 的默认防护。
  preview: {
    allowedHosts: true,
  },
})
