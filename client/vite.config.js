import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vendor code changes far less often than app code, so splitting it
        // out lets browsers cache it across deploys. recharts in particular
        // is heavy and only needed by dashboard pages, so it's kept out of
        // whatever chunk loads first.
        //
        // A function (not the {name: [packages]} object form) is required
        // here — the object form pulls in a package's shared transitive
        // deps too, which previously swept `clsx` (used on pages with no
        // chart, like attendance) into the same chunk as recharts.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Tiny shared utility that recharts also happens to depend on —
          // pin it explicitly so Rollup's automatic chunking can never fold
          // it into vendor-charts just because recharts imports it too.
          if (/node_modules[\\/]clsx[\\/]/.test(id)) return 'vendor-react';
          if (id.includes('recharts') || id.includes('/d3-')) return 'vendor-charts';
          if (id.includes('react-router')) return 'vendor-react';
          if (/node_modules[\\/]react(-dom)?[\\/]/.test(id)) return 'vendor-react';
          if (id.includes('@reduxjs') || id.includes('react-redux')) return 'vendor-redux';
          return undefined;
        },
      },
    },
    modulePreload: {
      // Vite's default preloads every chunk reachable via any lazy route,
      // which would fetch the 100KB+ charts vendor chunk on every page load
      // — including a teacher who only ever opens /attendance. Only the
      // chart chunk is worth excluding; everything else stays preloaded for
      // snappy in-app navigation.
      resolveDependencies: (_filename, deps) => deps.filter((dep) => !dep.includes('vendor-charts')),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
