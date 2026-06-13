import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: path.resolve(import.meta.dirname),
  resolve: {
    preserveSymlinks: true,
  },
  plugins: [react(), tailwindcss()],
})
