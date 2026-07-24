import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_PUBLIC_BASE ?? "/",
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 4313,
    strictPort: true,
  },
  build: {
    target: "es2022",
  },
});
