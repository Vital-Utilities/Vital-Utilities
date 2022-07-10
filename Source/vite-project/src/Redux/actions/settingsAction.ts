import { AnyAction } from "@reduxjs/toolkit";
import { SettingsDto } from "@vital/vitalservice";
import { settingsApi } from "./api";

export type SettingsActionTypes = GetSettingsAction;

const GET_SETTINGS = "GET_SETTINGS";

function recieveSettings(message: SettingsDto) {
    return { type: GET_SETTINGS, message: message };
}

interface GetSettingsAction {
    type: typeof GET_SETTINGS;
    message: SettingsDto;
}

function sendGetSettingsRequest() {
    return settingsApi
        .apiSettingsGet()
        .then(response => response)
        .catch(e => {
            console.error(e);
            return Promise.reject(e);
        });
}

export function fetchSettingsAction(): AnyAction {
    //@ts-ignore
    return function (dispatch) {
        return sendGetSettingsRequest()
            .then(result => dispatch(recieveSettings(result.data)))
            .catch(e => console.error(e));
    };
}
export function recieveSettingsAction(entities: SettingsDto) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveSettings(entities));
    };
}
