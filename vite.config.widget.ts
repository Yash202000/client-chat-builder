import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { resolve } from 'path';

// This is a dedicated configuration file for building the widget.
// It is separate from the main application's vite.config.ts.

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // The output directory is still 'dist', but it will only contain the widget file.
    // We will need to run two separate build commands.
    outDir: 'dist',
    rollupOptions: {
      // The single entry point for the widget.
      input: resolve(__dirname, 'src/widget.tsx'),
      output: {
        // The format is 'iife' (Immediately Invoked Function Expression)
        // which is a self-executing function, perfect for a widget.
        format: 'iife',
        // The name of the global variable the IIFE will expose, if needed.
        // Not strictly necessary for this widget but good practice.
        name: 'AgentConnectWidget',
        // The output file name.
        entryFileNames: 'widget.js',
        // We don't want hashes in the asset names for the widget bundle.
        assetFileNames: 'widget-assets/[name][extname]',
      },
    },
    // We don't want to clear the dist directory on this build,
    // as the main app build will handle that.
    emptyOutDir: false,
  },
});
