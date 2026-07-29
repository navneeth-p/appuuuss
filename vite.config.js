import { defineConfig } from 'vite';

// base: './' -> relative asset paths so it runs from a home-server subpath
// or a GitHub Pages project URL (https://user.github.io/repo/) unchanged.
export default defineConfig({
  base: './',
  build: {
    target: 'esnext', // top-level await + wasm support for rapier3d-compat
    outDir: 'docs', // GitHub Pages serves the built site from /docs
    emptyOutDir: true,
  },
  optimizeDeps: {
    // rapier3d-compat ships wasm; let it resolve natively rather than prebundling
    exclude: ['@dimforge/rapier3d-compat'],
  },
});
