import { InitialState, SettingsState } from "../States";
import { SettingsActionTypes } from "../actions/settingsAction";

export function SettingsReducer(state = InitialState.settingsState, action: SettingsActionTypes): SettingsState {
    switch (action.type) {
        case "GET_SETTINGS": {
            const newState = { ...state };
            newState.settings = action.message;
            return newState;
        }

        default:
            return state;
    }
}
