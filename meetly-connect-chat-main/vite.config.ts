// vite.config.ts (Simplified - No WS Logic)

import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import basicSsl from '@vitejs/plugin-basic-ssl';

// No Signaling Logic or WS Plugin needed here anymore!

export default defineConfig(({ mode }) => ({
  server: {
    host: true,       // Listen on all network interfaces
    port: 8080,       // Port for the React app
    https: true,      // Enable HTTPS using basicSsl for the React app server
  },
  plugins: [
    react(),
    basicSsl(),       // Handles HTTPS setup for Vite app server
    mode === 'development' ? componentTagger() : null, // Keep if using lovable-tagger
  ].filter((plugin): plugin is PluginOption => !!plugin), // Filter out null plugins
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));