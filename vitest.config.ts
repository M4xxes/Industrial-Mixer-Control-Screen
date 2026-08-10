import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/data/**'],
      thresholds: {
        'src/utils/alarmLogic.ts': { lines: 85 },
        'src/utils/doseDeviation.ts': { lines: 85 },
        'src/utils/recipeSteps.ts': { lines: 85 },
      },
    },
  },
});
