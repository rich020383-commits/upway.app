import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    // `proxy.test.ts` vive en la raíz: el include tiene que nombrarlo o vitest
    // ni lo ve y el redirect de host canónico queda sin cubrir.
    include: ['lib/**/*.test.ts', 'app/**/*.test.ts', 'upway-health/**/*.test.ts', 'proxy.test.ts'],
    environment: 'node',
  },
});
