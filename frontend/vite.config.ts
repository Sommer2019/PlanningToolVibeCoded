import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Base path: apex domain (sommer2019.de) serves from "/". Override with BASE_PATH
// when deploying under a sub-path (e.g. a project Pages site).
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    port: 5173,
  },
});
