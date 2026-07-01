import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'src/index.ts', // barrel-файл, только реэкспорты — нечего покрывать
      ],
    },
  },
});
