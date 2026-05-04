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
          // Core React runtime — always tiny, always cached
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // UI primitives — shared across marketing + dashboard
          if (id.includes('node_modules/@radix-ui/') ||
              id.includes('node_modules/lucide-react/') ||
              id.includes('node_modules/class-variance-authority/') ||
              id.includes('node_modules/clsx/') ||
              id.includes('node_modules/tailwind-merge/')) {
            return 'vendor-ui';
          }
          // Animation — used on marketing pages
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion';
          }
          // Data fetching
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query';
          }
          // Marketing pages — public SEO pages share one chunk
          if (id.includes('/pages/FeaturesPage') ||
              id.includes('/pages/PricingPage') ||
              id.includes('/pages/UseCasesPage') ||
              id.includes('/pages/UseCaseDetailPage') ||
              id.includes('/components/MarketingLayout')) {
            return 'chunk-marketing';
          }
          // Blog pages — share one chunk (includes react-markdown)
          if (id.includes('/pages/BlogListPage') ||
              id.includes('/pages/BlogPostPage') ||
              id.includes('/data/blogPosts') ||
              id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/remark') ||
              id.includes('node_modules/rehype') ||
              id.includes('node_modules/unified') ||
              id.includes('node_modules/mdast') ||
              id.includes('node_modules/hast') ||
              id.includes('node_modules/vfile') ||
              id.includes('node_modules/micromark')) {
            return 'chunk-blog';
          }
          // CRM pages — load only when /dashboard/crm is visited
          if (id.includes('/pages/CRM/')) {
            return 'chunk-crm';
          }
          // CMS pages — load only when /dashboard/cms is visited
          if (id.includes('/pages/CMS') || id.includes('/pages/KnowledgeBaseCMS')) {
            return 'chunk-cms';
          }
          // Social / Marketing Hub
          if (id.includes('/pages/Social/')) {
            return 'chunk-social';
          }
          // AI tools
          if (id.includes('AIImage') || id.includes('AIChat') || id.includes('AITool')) {
            return 'chunk-ai-tools';
          }
          // LiveKit — only loaded on video call pages
          if (id.includes('node_modules/livekit-client/') ||
              id.includes('node_modules/@livekit/')) {
            return 'vendor-livekit';
          }
          // Charts — only loaded on Reports page
          if (id.includes('node_modules/recharts/') ||
              id.includes('node_modules/d3') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory')) {
            return 'vendor-charts';
          }
          // RxJS
          if (id.includes('node_modules/rxjs/')) {
            return 'vendor-rxjs';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns/')) {
            return 'vendor-dates';
          }
          // Twilio — only loaded on call-center pages
          if (id.includes('node_modules/@twilio/') ||
              id.includes('node_modules/twilio-')) {
            return 'vendor-twilio';
          }
          // Code editor (ace-builds) — only loaded when user opens code editor
          if (id.includes('node_modules/ace-builds/')) {
            return 'vendor-ace';
          }
          // Syntax highlighting — used in chat/KB pages
          if (id.includes('node_modules/react-syntax-highlighter/') ||
              id.includes('node_modules/refractor/') ||
              id.includes('node_modules/prismjs/')) {
            return 'vendor-syntax';
          }
          // Lexical rich text editor
          if (id.includes('node_modules/@lexical/') ||
              id.includes('node_modules/lexical/') ||
              id.includes('node_modules/lib0/') ||
              id.includes('node_modules/y-')) {
            return 'vendor-editor';
          }
          // Maps
          if (id.includes('node_modules/leaflet/') ||
              id.includes('node_modules/react-leaflet/')) {
            return 'vendor-maps';
          }
          // Everything else in node_modules goes into a general vendor chunk
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  }
}});
