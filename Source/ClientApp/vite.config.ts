import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import progress from "vite-plugin-progress";
import eslint from "vite-plugin-eslint";
import vis from "rollup-plugin-visualizer";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react({ fastRefresh: true }), progress(), eslint({ cache: true, fix: true }), vis()],
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    server: {
        port: 3000
    }
});
