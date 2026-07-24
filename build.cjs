const { build } = require('vite');
const react = require('@vitejs/plugin-react');
const path = require('path');
const { execSync } = require('child_process');

const root = __dirname;
const clientDir = path.join(root, 'client');

// Install client deps
console.log('Installing client dependencies...');
execSync('npm install', { cwd: clientDir, stdio: 'inherit' });

// Build
console.log('Building...');
build({
  root: './client',
  plugins: [react.default ? react.default() : react()],
  resolve: {
    alias: { '@': path.resolve(root, 'client/src') },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 400,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
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
}).then(() => {
  console.log('Build completed');
}).catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
