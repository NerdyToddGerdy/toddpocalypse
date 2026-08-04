import { defineConfig, coverageConfigDefaults } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      exclude: [
        ...coverageConfigDefaults.exclude,
        "OLD_CODE/**",
        "infra/**",
        "scripts/**",
        "src/changelog.ts",
      ],
    },
  },
});