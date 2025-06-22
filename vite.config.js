import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "process.env": env,
    },
    server: {
      proxy: {
        "/trans": {
          target: "http://localhost:1488/trans",
        },
        "/api/chat": {
          target: "http://localhost:1488/ask",
        },
        "/clear": {
          target: "http://localhost:1488/clear",
        },
        "/load-more": {
          target: "http://localhost:1488/load-more",
        },
      },
    },
  };
});
