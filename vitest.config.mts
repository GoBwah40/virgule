import path from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const alias = { "@": path.resolve(import.meta.dirname, "src") };

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    projects: [
      {
        // Logique pure (scores, exports…) : environnement Node.
        extends: true,
        test: { name: "unit", environment: "node", include: ["src/lib/**/*.test.ts", "src/i18n/**/*.test.ts"] },
      },
      {
        // Composants globaux : DOM simulé + Testing Library.
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          include: ["src/components/**/*.test.tsx"],
          setupFiles: ["./vitest.setup.ts"],
        },
      },
    ],
  },
});
