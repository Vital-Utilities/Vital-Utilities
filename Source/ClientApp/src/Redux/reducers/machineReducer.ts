import { InitialState, MachineState } from "../States";
import _ from "lodash";
import { MachineActionTypes } from "../actions/machineActions";

export function MachineReducer(state = InitialState.machineState, action: MachineActionTypes): MachineState {
    switch (action.type) {
        case "UPDATE_MACHINE_STATIC_DATA": {
            return { ...state, static: action.message };
        }
        case "UPDATE_MACHINE_DYNAMIC_DATA": {
            const newState = { ...state.dynamic };
            const merged = _.mergeWith({}, newState, action.message, (o, s) => (_.isNull(s) ? o : s));
            return { ...state, dynamic: merged };
        }
        case "UPDATE_MACHINE_TIMESERIES_DATA": {
            return { ...state, timeSeriesMetricsState: action.message };
        }
        default:
            return state;
    }
}
