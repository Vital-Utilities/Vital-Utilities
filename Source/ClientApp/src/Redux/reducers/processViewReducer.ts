import { ProcessViewActionTypes } from "../actions/processViewActions";
import { InitialState, ProcessViewState } from "../States";

export function ProcessViewReducer(state = InitialState.processViewState, action: ProcessViewActionTypes): ProcessViewState {
    switch (action.type) {
        case "FETCH_ALL_PROCESSVIEW": {
            const newState = { ...state };
            newState.processView = action.message.processView;
            return newState;
        }
        case "DELETE_PROCESSVIEW": {
            const newState = { ...state };
            delete newState.processView[action.id];
            return newState;
        }
        default:
            return state;
    }
}
