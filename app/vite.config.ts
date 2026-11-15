import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base so the same build works at a GitHub Pages sub-path
// (https://<owner>.github.io/<repo>/) and on any static host.
export default defineConfig({
  base: './',
  plugins: [react()],
})
