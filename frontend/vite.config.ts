import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['lucide-react'],
  },
  define: {
    // Add React Router future flags
    'process.env.ROUTER_FUTURE_v7_startTransition': 'true',
    'process.env.ROUTER_FUTURE_v7_relativeSplatPath': 'true'
  }
});
