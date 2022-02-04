import { ManagedActionTypes } from "../actions/managedModelActions";
import { InitialState, ManagedState } from "../States";
import { message } from "antd";

export function ManagedReducer(state = InitialState.managedState, action: ManagedActionTypes): ManagedState {
    switch (action.type) {
        case "FETCH_ALL_MANAGED": {
            const newState = { ...state };
            newState.managed = action.message;
            return newState;
        }
        case "ADD_MANAGED": {
            const newState = { ...state };
            newState.managed.push(action.message);
            message.info(`${action.message.processName} config was added`);
            return newState;
        }
        case "DELETE_MANAGED": {
            const managed = state.managed.find(e => e.id === action.id);
            message.info(`${managed?.processName} config was removed`);
            return { ...state, managed: state.managed.filter(e => e.id !== action.id) };
        }
        case "UPDATE_MANAGED": {
            const newState = { ...state };
            const index = newState.managed.findIndex(e => e.id === action.message.id);
            // eslint-disable-next-line security/detect-object-injection
            newState.managed[index] = action.message;
            message.info(`${action.message.processName} config was updated`);

            return newState;
        }
        default:
            return state;
    }
}
