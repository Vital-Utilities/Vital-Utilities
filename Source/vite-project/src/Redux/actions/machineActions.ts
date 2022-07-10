import { AnyAction } from "@reduxjs/toolkit";
import { GetMachineDynamicDataResponse, GetMachineStaticDataResponse, GetMachineTimeSeriesRequest, TimeSeriesMachineMetricsResponse } from "@vital/vitalservice";
import { systemApi } from "./api";
export type MachineActionTypes = UpdateMachineDynamicDataAction | UpdateMachineStaticDataAction | UpdateMachineTimeSeriesDataAction;

const UPDATE_MACHINE_DYNAMIC_DATA = "UPDATE_MACHINE_DYNAMIC_DATA";
const UPDATE_MACHINE_STATIC_DATA = "UPDATE_MACHINE_STATIC_DATA";
const UPDATE_MACHINE_TIMESERIES_DATA = "UPDATE_MACHINE_TIMESERIES_DATA";
interface UpdateMachineDynamicDataAction {
    type: typeof UPDATE_MACHINE_DYNAMIC_DATA;
    message: GetMachineDynamicDataResponse;
}

interface UpdateMachineStaticDataAction {
    type: typeof UPDATE_MACHINE_STATIC_DATA;
    message: GetMachineStaticDataResponse;
}
interface UpdateMachineTimeSeriesDataAction {
    type: typeof UPDATE_MACHINE_TIMESERIES_DATA;
    message: TimeSeriesMachineMetricsResponse;
}

function recieveMachineTimeSeriesData(message: TimeSeriesMachineMetricsResponse) {
    return { type: UPDATE_MACHINE_TIMESERIES_DATA, message: message };
}

function recieveMachineDynamicData(message: GetMachineDynamicDataResponse) {
    return { type: UPDATE_MACHINE_DYNAMIC_DATA, message: message };
}
function recieveMachineStaticData(message: GetMachineStaticDataResponse) {
    return { type: UPDATE_MACHINE_STATIC_DATA, message: message };
}
async function sendGetMachineStaticRequest() {
    return systemApi
        .apiSystemStaticGet()
        .then(response => response)
        .catch(e => {
            console.error(e);
            return Promise.reject(e);
        });
}
function sendGetMachineDynamicRequest() {
    return systemApi
        .apiSystemDynamicGet()
        .then(response => response)
        .catch(e => {
            console.error(e);
            return Promise.reject(e);
        });
}

function sendGetMachineTimeSeriesRequest(message: GetMachineTimeSeriesRequest) {
    return systemApi
        .apiSystemTimeseriesPost({ getMachineTimeSeriesRequest: message })
        .then(response => response)
        .catch(e => {
            console.error(e);
            return Promise.reject(e);
        });
}
export function fetchMachineTimeSeriesDataAction(message: GetMachineTimeSeriesRequest): AnyAction {
    //@ts-ignore
    return function (dispatch) {
        return sendGetMachineTimeSeriesRequest(message)
            .then(result => dispatch(recieveMachineTimeSeriesData(result)))
            .catch(e => console.error(e));
    };
}
export function fetchMachineStaticDataAction(): AnyAction {
    //@ts-ignore
    return function (dispatch) {
        return sendGetMachineStaticRequest()
            .then(result => dispatch(recieveMachineStaticData(result)))
            .catch(e => console.error(e));
    };
}

export function fetchMachineDynamicDataAction(): AnyAction {
    //@ts-ignore
    return function (dispatch) {
        return sendGetMachineDynamicRequest()
            .then(result => dispatch(recieveMachineDynamicData(result)))
            .catch(e => console.error(e));
    };
}
export function recieveMachineDynamicDataAction(entities: GetMachineDynamicDataResponse): AnyAction {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveMachineDynamicData(entities));
    };
}
