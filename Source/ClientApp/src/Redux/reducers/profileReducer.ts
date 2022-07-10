import { InitialState, ProfileState } from "../States";
import { message } from "antd";
import { ProfileActionTypes } from "../actions/profileActions";

export function ProfileReducer(state = InitialState.profileState, action: ProfileActionTypes): ProfileState {
    switch (action.type) {
        case "FETCH_ALL_PROFILES": {
            const newState = { ...state };
            newState.profiles = action.message;
            return newState;
        }
        case "ADD_PROFILE": {
            const newState = { ...state };
            newState.profiles.push(action.message);
            message.info(`Profile: ${action.message.name} has been added`);
            return newState;
        }
        case "DELETE_PROFILES": {
            const profile = state.profiles.find(e => e.id === action.message);
            message.info(`Profile: ${profile?.name} was removed`);
            return { ...state, profiles: state.profiles.filter(e => e.id !== action.message) };
        }
        case "UPDATE_PROFILE": {
            const newState = { ...state };
            const index = newState.profiles.findIndex(e => e.id === action.message.id);
            // eslint-disable-next-line security/detect-object-injection
            newState.profiles[index] = action.message;
            message.info(`Profile: ${action.message.name} was updated`);

            return newState;
        }
        default:
            return state;
    }
}
