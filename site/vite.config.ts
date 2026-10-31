import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "src");

export default defineConfig({
    base: "./",
    plugins: [react()],
    css: {
        preprocessorOptions: {
            scss: {
                additionalData: (content: string, filename: string) => {
                    if (filename.replace(/\\/g, "/").includes("styles/mixins")) return content;
                    return `@use "styles/mixins" as *;\n${content}`;
                },
                loadPaths: [srcDir],
            },
        },
    },
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
