import * as React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import "./index.css";
import "./custom.scss";
import { RouterProvider } from "@tanstack/react-router";
import configureStore from "./Redux/store/configureStore";
import ManagedHubSignalR from "./Services/SignalR";
import { ServiceLiveMonitor } from "./Services/ServiceLiveMonitor";

import { ApiPortHandler } from "./Services/ApiPortHandler";
import * as Sentry from "@sentry/react";
import packageJson from "../package.json";
import reportWebVitals from "./reportWebVitals";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { router } from "./router";

if (process.env.NODE_ENV === "production") {
    Sentry.init({
        dsn: "REPLACE_WITH_SENTRYIO_REACT_DSN",
        attachStacktrace: true,
        release: packageJson.version
    });
}
const store = configureStore();
// @ts-ignore
const tauri_globals = window?.__TAURI__?.app;
console.log(`Webapp instance is in: ${tauri_globals ? "Tauri Client" : "Web browser"}`);
if (!tauri_globals) toast("Webapp instance is in: Web browser, expect some missing functionalities.", { icon: "⚠️", duration: 3000 });

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <Provider store={store}>
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: "#333",
                        color: "#fff"
                    }
                }}
            />
            <ApiPortHandler />
            <ServiceLiveMonitor />
            <ManagedHubSignalR />
            <RouterProvider router={router} />
        </Provider>
    </React.StrictMode>
);
reportWebVitals();
