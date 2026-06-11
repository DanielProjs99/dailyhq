import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// W trybie dev proxujemy API i WebSocket do backendu na :3000
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': { target: 'http://localhost:3000', ws: true },
    },
  },
});
