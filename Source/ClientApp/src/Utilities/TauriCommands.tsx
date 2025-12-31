import { invoke } from "@tauri-apps/api/core";
import { ClientSettings } from "@vital/vitalservice";
import { useRequest } from "ahooks";
import toast from "react-hot-toast";

export function openUrl(url: string) {
    invoke<string>("open_url", { url: url })
        .then(() => null)
        .catch(error => {
            toast.error(String(error));
            console.error(error);
        });
}

export function useOs() {
    const { data } = useRequest(() => getOs(), { manual: false });
    return data;
}

export function getOs() {
    return invoke<string>("get_os")
        .then(response => response)
        .catch(error => {
            toast.error(String(error));
            console.error(error);
            return undefined;
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
