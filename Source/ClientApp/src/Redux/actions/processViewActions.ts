/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { AnyAction } from "@reduxjs/toolkit";
import { GetRunningProcessesResponse, ProcessViewDto } from "@vital/vitalservice";
import { processApi } from "./api";

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
    id: number;
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

function recieveDeleteProcessView(id: number) {
    return { type: DELETE_PROCESSVIEW, id: id };
}

function fetchProcessView() {
    return processApi
        .apiProcessRunningProcessesGet()
        .then(response => response.data)
        .catch(e => Promise.reject(e));
}

export function recieveDeleteProcessViewAction(entityId: number) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveDeleteProcessView(entityId));
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
