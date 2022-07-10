import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import progress from "vite-plugin-progress";
import eslint from "vite-plugin-eslint";
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), progress(), eslint()]
});
