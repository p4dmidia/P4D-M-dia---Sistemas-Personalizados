import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

export default defineConfig({
  root: '.', // Define explicitamente a raiz do projeto
  base: '/', // Garante que os caminhos dos assets sejam resolvidos a partir da raiz
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [...mochaPlugins(process.env as any), react(), cloudflare()],
  server: {
    allowedHosts: true,
  },
  build: {
    outDir: 'client',
    chunkSizeWarningLimit: 5000,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html') // Define explicitamente index.html como ponto de entrada
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});