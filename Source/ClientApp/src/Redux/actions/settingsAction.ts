import { AnyAction } from "@reduxjs/toolkit";
import { SettingsDto } from "@vital/vitalservice";
import { settingsApi } from "./tauriApi";

export type SettingsActionTypes = GetSettingsAction;

const GET_SETTINGS = "GET_SETTINGS";

function recieveSettings(message: SettingsDto) {
    return { type: GET_SETTINGS, message: message };
}

interface GetSettingsAction {
    type: typeof GET_SETTINGS;
    message: SettingsDto;
}

export function fetchSettingsAction(): AnyAction {
    //@ts-ignore
    return function (dispatch) {
        return settingsApi
            .get()
            .then(result => dispatch(recieveSettings(result)))
            .catch(e => console.error(e));
    };
}
export function recieveSettingsAction(entities: SettingsDto) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveSettings(entities));
    };
}
