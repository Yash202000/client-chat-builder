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
    // Output widget directly to backend's static directory
    outDir: '../backend/app/static/widget',
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
        assetFileNames: '[name][extname]',
      },
    },
    // Clear the widget output directory on each build
    emptyOutDir: true,
  },
});
