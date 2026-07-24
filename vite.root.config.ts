import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: 'client',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 400,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor'
          if (id.includes('node_modules/firebase')) return 'firebase'
          if (id.includes('node_modules/livekit')) return 'livekit'
          if (id.includes('node_modules/framer-motion')) return 'motion'
          if (id.includes('node_modules/react-icons')) return 'icons'
          if (id.includes('node_modules')) return 'deps'
        },
      },
    },
  },
})
