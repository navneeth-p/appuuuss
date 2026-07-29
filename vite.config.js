import { defineConfig } from 'vite';

// base: './' -> relative asset paths so it runs from a home-server subpath
// or a GitHub Pages project URL (https://user.github.io/repo/) unchanged.
export default defineConfig({
  base: './',
  build: {
    target: 'esnext', // top-level await + wasm support for rapier3d-compat
  },
  optimizeDeps: {
    // rapier3d-compat ships wasm; let it resolve natively rather than prebundling
    exclude: ['@dimforge/rapier3d-compat'],
  },
});
