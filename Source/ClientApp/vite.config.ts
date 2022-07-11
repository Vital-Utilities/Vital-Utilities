import { defineConfig } from "vite";
import react from "vite-preset-react";
import progress from "vite-plugin-progress";
import eslint from "vite-plugin-eslint";
import vis from "rollup-plugin-visualizer";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react({ removeDevtoolsInProd: true, injectReact: true, reactPluginOptions: { fastRefresh: true } }), progress(), eslint({ cache: true, fix: true }), vis()],
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
});
