import { invoke } from "@tauri-apps/api";
import { useRequest } from "ahooks";
import { notification } from "antd";
import { ClientSettings } from "../Dtos/Dto";

export function openUrl(url: string) {
    invoke<string>("open_url", { url: url })
        .then(() => null)
        .catch(error => {
            notification.error(error);
            console.error(error);
        });
}

export function useRustClientSettings() {
    const { data, run, mutate } = useRequest(() => getSettings(), {});

    function getSettings() {
        return invoke<ClientSettings>("get_client_settings")
            .then(response => {
                return Promise.resolve(response);
            })
            .catch((error: string) => {
                console.error(error);
                return Promise.reject(error);
            });
    }
    function updateSettings(clientSettings: ClientSettings) {
        return invoke<ClientSettings>("update_client_settings", { clientSettings: clientSettings })
            .then(() => {
                mutate(clientSettings);
                return Promise.resolve();
            })
            .catch((error: string) => {
                console.error(error);
                return Promise.reject(error);
            });
    }

    return { clientSettings: data, fetchAgain: run, updateClientSettings: updateSettings };
}
