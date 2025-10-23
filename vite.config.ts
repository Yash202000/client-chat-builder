import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL || 'http://localhost:8000';

  console.log('🔧 Vite Config - Backend URL:', backendUrl);
  console.log('🔧 Vite Config - All VITE_ env vars:', Object.keys(env).filter(k => k.startsWith('VITE_')));

  return {
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        ws: true,
      },
    },
    headers: {
    'Content-Security-Policy':
      "default-src 'self'; " +
      "frame-src https:; " +
      "script-src 'self' 'sha256-Z2/iFzh9VMlVkEOar1f/oSHWwQk3ve1qk/C2WdsC4Xk='; " +
      "object-src 'none'; " +
      "style-src 'self' 'unsafe-inline'; " +
      `img-src 'self' ${backendUrl} data: blob:; ` +
      "font-src 'self' data:; " +
      `connect-src 'self' ${backendUrl} https://*.livekit.cloud wss://*.livekit.cloud ws: wss: https://ultralytics.com;`
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // The build configuration now only pertains to the main application.
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  }
}});
