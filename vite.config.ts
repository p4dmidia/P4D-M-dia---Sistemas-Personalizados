import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

export default defineConfig({
  root: '.', // Mantém a raiz do projeto explícita
  base: '/', // Mantém os caminhos dos assets a partir da raiz
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [...mochaPlugins(process.env as any), react(), cloudflare()],
  server: {
    allowedHosts: true,
  },
  build: {
    outDir: 'client', // Mantém a pasta de saída como 'client'
    chunkSizeWarningLimit: 5000,
    // Removido: rollupOptions.input, que estava causando o erro
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});