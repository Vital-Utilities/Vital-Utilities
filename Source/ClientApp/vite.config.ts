import { defineConfig } from "vite";
import react from "vite-preset-react";
import progress from "vite-plugin-progress";
import eslint from "vite-plugin-eslint";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react({ removeDevtoolsInProd: true, injectReact: true }), progress(), eslint()],
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
});
