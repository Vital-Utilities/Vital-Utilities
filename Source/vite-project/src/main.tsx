import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import "./custom.scss";
import { BrowserRouter } from "react-router-dom";
import configureStore from "./Redux/store/configureStore";
import ManagedHubSignalR from "./Services/SignalR";
import App from "./App";
import { ServiceLiveMonitor } from "./Services/ServiceLiveMonitor";

import { ApiPortHandler } from "./Services/ApiPortHandler";
import * as Sentry from "@sentry/react";
import notification from "antd/lib/notification";
import packageJson from "../package.json";
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
if (!tauri_globals) notification.warning({ duration: 3, message: "Webapp instance is in: Web browser, expect some missing functionalities." });
ReactDOM.render(
    <React.StrictMode>
        <BrowserRouter>
            <Provider store={store}>
                <ApiPortHandler />
                <ServiceLiveMonitor />
                <ManagedHubSignalR />
                <App />
            </Provider>
        </BrowserRouter>
    </React.StrictMode>,
    document.getElementById("root")
);
