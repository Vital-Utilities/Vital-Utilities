import { InitialState, AppState } from "../States";
import { AppActionTypes } from "../actions/appActions";

export function AppReducer(state = InitialState.appState, action: AppActionTypes): AppState {
    switch (action.type) {
        case "UPDATE_APP_READY":
            return { ...state, appReady: action.ready };
        case "UPDATE_SIGNALR_CONNECTED":
            if (action.connected) {
                console.info("SignalR Connected");
            }
            return { ...state, signalRConnected: action.connected };
        case "UPDATE_HTTP_CONNECTED":
            if (action.connected) {
                console.info("API Connected");
            }
            return { ...state, httpConnected: action.connected };
        case "UPDATE_API_PORT":
            console.info("Api port changed to " + action.port);
            return { ...state, vitalServicePort: action.port };
        default:
            return state;
    }
}
