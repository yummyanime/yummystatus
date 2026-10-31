import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
    base: "./",
    plugins: [react()],
    server: {
        host: true,
        watch: {
            usePolling: true,
            interval: 100,
        },
        proxy: {
            "/api": {
                target: process.env.API_URL ?? "http://localhost:3000",
                changeOrigin: true,
            },
        },
    },
});
