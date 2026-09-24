import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

// Source-identifier attributes are a dev aid only; never ship them in builds
export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [
    react(),
    sourceIdentifierPlugin({
      enabled: command === 'serve',
      attributePrefix: 'data-matrix',
      includeProps: true,
    })
  ],
  esbuild: {
    charset: 'ascii',
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}))
