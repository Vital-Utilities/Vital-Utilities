/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { AnyAction } from "@reduxjs/toolkit";
import axios from "axios";
import { GetRunningProcessesResponse, ProcessViewDto } from "../../Dtos/Dto";

export type ProcessViewActionTypes = FetchAllProcessViewAction | AddProcessViewAction | UpdateProcessViewAction | DeleteProcessViewAction;

// ProcessViewModels
export const ADD_PROCESSVIEW = "ADD_PROCESSVIEW";
export const FETCH_ALL_PROCESSVIEW = "FETCH_ALL_PROCESSVIEW";
export const DELETE_PROCESSVIEW = "DELETE_PROCESSVIEW";
export const UPDATE_PROCESSVIEW = "UPDATE_PROCESSVIEW";

interface FetchAllProcessViewAction {
    type: typeof FETCH_ALL_PROCESSVIEW;
    message: GetRunningProcessesResponse;
}

interface AddProcessViewAction {
    type: typeof ADD_PROCESSVIEW;
    message: ProcessViewDto;
}

interface UpdateProcessViewAction {
    type: typeof UPDATE_PROCESSVIEW;
    message: ProcessViewDto;
}
interface DeleteProcessViewAction {
    type: typeof DELETE_PROCESSVIEW;
    message: string;
}

function recieveAllProcessView(message: GetRunningProcessesResponse) {
    return { type: FETCH_ALL_PROCESSVIEW, message: message };
}

function recieveNewProcessView(message: ProcessViewDto) {
    return { type: ADD_PROCESSVIEW, message: message };
}

function recieveUpdateProcessView(message: ProcessViewDto) {
    return { type: UPDATE_PROCESSVIEW, message: message };
}

function recieveDeleteProcessView(message: string) {
    return { type: DELETE_PROCESSVIEW, message: message };
}

function fetchProcessView() {
    return axios
        .get<GetRunningProcessesResponse>("api/Process/RunningProcesses")
        .then(response => response.data)
        .catch(e => Promise.reject(e));
}

export function recieveDeleteProcessViewAction(entityIds: string) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveDeleteProcessView(entityIds));
    };
}

export function fetchRunningProcessesAction(): AnyAction {
    //@ts-ignore
    return function (dispatch) {
        fetchProcessView()
            .then(result => dispatch(recieveAllProcessView(result)))
            .catch(e => console.error(e));
    };
}

export function recieveProcessViewProcessAddedAction(entities: ProcessViewDto) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveNewProcessView(entities));
    };
}

export function recieveProcessViewUpdatedAction(entities: ProcessViewDto) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveUpdateProcessView(entities));
    };
}
