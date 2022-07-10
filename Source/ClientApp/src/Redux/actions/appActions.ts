import { AnyAction } from "@reduxjs/toolkit";

const UPDATE_APP_READY = "UPDATE_APP_READY";
const UPDATE_SIGNALR_CONNECTED = "UPDATE_SIGNALR_CONNECTED";
const UPDATE_HTTP_CONNECTED = "UPDATE_HTTP_CONNECTED";
const UPDATE_API_PORT = "UPDATE_API_PORT";
export type AppActionTypes = UpdateAppReadyAction | UpdateSignalRConnectedAction | UpdateHttpConnectedAction | UpdateApiPortAction;
interface UpdateAppReadyAction {
    type: typeof UPDATE_APP_READY;
    ready: boolean;
}

interface UpdateSignalRConnectedAction {
    type: typeof UPDATE_SIGNALR_CONNECTED;
    connected: boolean;
}

interface UpdateHttpConnectedAction {
    type: typeof UPDATE_HTTP_CONNECTED;
    connected: boolean;
}

interface UpdateApiPortAction {
    type: typeof UPDATE_API_PORT;
    port: number;
}

export function updateAppReadyAction(ready: boolean): AnyAction {
    function updateAppReady(ready: boolean): UpdateAppReadyAction {
        return { type: UPDATE_APP_READY, ready: ready };
    }
    //@ts-ignore
    return function (dispatch) {
        dispatch(updateAppReady(ready));
    };
}
export function updateSignalRConnectedAction(connected: boolean): AnyAction {
    function updateAppReady(connected: boolean): UpdateSignalRConnectedAction {
        return { type: UPDATE_SIGNALR_CONNECTED, connected: connected };
    }
    //@ts-ignore
    return function (dispatch) {
        dispatch(updateAppReady(connected));
    };
}

export function updateHttpConnectedAction(connected: boolean): AnyAction {
    function updateHttpConnected(connected: boolean): UpdateHttpConnectedAction {
        return { type: UPDATE_HTTP_CONNECTED, connected: connected };
    }
    //@ts-ignore
    return function (dispatch) {
        dispatch(updateHttpConnected(connected));
    };
}

export function updateApiPortAction(port: number): AnyAction {
    function updateApiPortAction(port: number): UpdateApiPortAction {
        return { type: UPDATE_API_PORT, port: port };
    }
    //@ts-ignore
    return function (dispatch) {
        dispatch(updateApiPortAction(port));
    };
}
