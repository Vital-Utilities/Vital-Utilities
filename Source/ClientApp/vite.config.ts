import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import progress from "vite-plugin-progress";
import eslint from "vite-plugin-eslint";
import vis from "rollup-plugin-visualizer";
export default defineConfig({
    plugins: [react({ fastRefresh: true }), progress(), eslint({ cache: true, fix: true }), vis()],
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    server: {
        strictPort: true
    },
    // to make use of `TAURI_PLATFORM`, `TAURI_ARCH`, `TAURI_FAMILY`,
    // `TAURI_PLATFORM_VERSION`, `TAURI_PLATFORM_TYPE` and `TAURI_DEBUG`
    // env variables
    envPrefix: ["VITE_", "TAURI_"],
    build: {
        // Tauri uses Chromium on Windows and WebKit on macOS and Linux
        target: process.env.TAURI_PLATFORM === "windows" ? "chrome105" : "safari13",
        // don't minify for debug builds
        minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
        // produce sourcemaps for debug builds
        sourcemap: !!process.env.TAURI_DEBUG
    },
    clearScreen: false
});
