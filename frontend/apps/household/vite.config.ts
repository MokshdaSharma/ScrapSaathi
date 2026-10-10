import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@scrapsaathi/api-client": fileURLToPath(new URL("../../shared/api-client/src/index.ts", import.meta.url)),
      "@scrapsaathi/ui-components": fileURLToPath(new URL("../../shared/ui-components/src/index.ts", import.meta.url)),
      "@scrapsaathi/route-optimizer": fileURLToPath(new URL("../../shared/route-optimizer/src/index.ts", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
});
