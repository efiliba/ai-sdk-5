import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  test: {
    setupFiles: ["dotenv/config"], // Make env vars available to evalite
  },
  plugins: [tsconfigPaths()], // Path resolutions must match ts config path
});
