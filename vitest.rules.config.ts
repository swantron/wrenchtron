import { defineConfig } from "vitest/config";

// Security rules tests. Run via `npm run test:rules`, which starts the emulator.
export default defineConfig({
  test: {
    environment: "node",
    include: ["rules-tests/**/*.test.ts"],
    // Tests share one emulator; run files serially so clearFirestore() doesn't race
    fileParallelism: false,
    testTimeout: 20000,
  },
});
