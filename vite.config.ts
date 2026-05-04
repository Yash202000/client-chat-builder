import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const backendUrl = env.VITE_BACKEND_URL;

  console.log('🔧 Vite Config - Backend URL:', backendUrl);
  console.log('🔧 Vite Config - All VITE_ env vars:', Object.keys(env).filter(k => k.startsWith('VITE_')));

  return {
  server: {
    host: "0.0.0.0",
    port: 8080,
    hmr: {
      protocol: env.VITE_HMR_PROTOCOL || 'ws',
      host: env.VITE_HMR_HOST || 'localhost',
      clientPort: env.VITE_HMR_PORT ? parseInt(env.VITE_HMR_PORT) : undefined,
    },
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        ws: true,
      },
    },
    // CSP disabled for development - MinIO images need to load
    // headers: {
    // 'Content-Security-Policy':
    //   "default-src 'self'; " +
    //   "frame-src https:; " +
    //   "script-src 'self' 'sha256-Z2/iFzh9VMlVkEOar1f/oSHWwQk3ve1qk/C2WdsC4Xk='; " +
    //   "object-src 'none'; " +
    //   "style-src 'self' 'unsafe-inline'; " +
    //   `img-src 'self' ${backendUrl} https://avatar.vercel.sh http: https: data: blob:; ` +
    //   "font-src 'self' data:; " +
    //   "media-src 'self' blob:; " +
    //   `connect-src 'self' ${backendUrl} https://*.livekit.cloud wss://*.livekit.cloud ws: wss: https://ultralytics.com;`
    // }
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
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        manualChunks(id) {
          // ── Strategy ────────────────────────────────────────────────────────
          // Only split packages that are (a) large AND (b) have NO React imports
          // at module evaluation time. Packages like @radix-ui, react-leaflet,
          // framer-motion, lucide-react all call React.forwardRef / createContext
          // at the top level — splitting them into separate chunks causes a race
          // where the chunk evaluates before vendor-react, crashing with
          // "Cannot read properties of undefined (reading 'forwardRef')".
          // Rollup resolves dependency order correctly when these stay together.
          // ────────────────────────────────────────────────────────────────────

          // LiveKit — large, independent, only on video-call pages
          if (id.includes('node_modules/livekit-client/') ||
              id.includes('node_modules/@livekit/')) {
            return 'vendor-livekit';
          }
          // d3 — pure JS, no React at module level (recharts/victory are React-based → vendor)
          if (id.includes('node_modules/d3/') ||
              id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // Maps — leaflet core is independent (react-leaflet stays with React ecosystem)
          if (id.includes('node_modules/leaflet/')) {
            return 'vendor-maps';
          }
          // Code editor — large, independent
          if (id.includes('node_modules/ace-builds/')) {
            return 'vendor-ace';
          }
          // Twilio — large, independent
          if (id.includes('node_modules/@twilio/') ||
              id.includes('node_modules/twilio-')) {
            return 'vendor-twilio';
          }
          // RxJS — independent
          if (id.includes('node_modules/rxjs/')) {
            return 'vendor-rxjs';
          }
          // Everything else (React, Radix, lucide, framer-motion, tanstack,
          // date-fns, react-leaflet, markdown, etc.) goes into vendor — Rollup
          // handles initialization order correctly within a single chunk.
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  }
}});
