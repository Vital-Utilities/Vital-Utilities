import { invoke } from "@tauri-apps/api";
import { notification } from "antd";

export function openUrl(url: string) {
    invoke<string>("open_url", { url: url })
        .then(() => null)
        .catch(error => {
            notification.error(error);
            console.error(error);
        });
}
