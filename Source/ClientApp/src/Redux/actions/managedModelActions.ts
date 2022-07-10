/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { AnyAction } from "@reduxjs/toolkit";
import { ManagedModelDto } from "@vital/vitalservice";
import { processApi } from "./api";

export type ManagedActionTypes = FetchAllManagedAction | AddManagedAction | UpdateManagedAction | DeleteManagedAction;

// ManagedModels
export const ADD_MANAGED = "ADD_MANAGED";
export const FETCH_ALL_MANAGED = "FETCH_ALL_MANAGED";
export const DELETE_MANAGED = "DELETE_MANAGED";
export const UPDATE_MANAGED = "UPDATE_MANAGED";

interface FetchAllManagedAction {
    type: typeof FETCH_ALL_MANAGED;
    message: ManagedModelDto[];
}

interface AddManagedAction {
    type: typeof ADD_MANAGED;
    message: ManagedModelDto;
}

interface UpdateManagedAction {
    type: typeof UPDATE_MANAGED;
    message: ManagedModelDto;
}
interface DeleteManagedAction {
    type: typeof DELETE_MANAGED;
    id: number;
}

function recieveAllManaged(message: ManagedModelDto[]) {
    return { type: FETCH_ALL_MANAGED, message: message };
}

function recieveNewManaged(message: ManagedModelDto) {
    return { type: ADD_MANAGED, message: message };
}

function recieveUpdateManaged(message: ManagedModelDto) {
    return { type: UPDATE_MANAGED, message: message };
}

function recieveDeleteManaged(id: number) {
    return { type: DELETE_MANAGED, id: id };
}

async function sendFetchManagedProcessesRequest() {
    return processApi
        .apiProcessManagedGet()
        .then(response => response.data)
        .catch(e => {
            console.error(e);
            return Promise.reject(e);
        });
}

async function fetchManagedProcesses() {
    const result = await sendFetchManagedProcessesRequest();
    return result.affinityModels;
}

export function recieveDeleteManagedProcessAction(entityId: number) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveDeleteManaged(entityId));
    };
}

export function fetchManagedProcessesAction(): AnyAction {
    //@ts-ignore
    return function (dispatch) {
        fetchManagedProcesses()
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            .then(result => dispatch(recieveAllManaged(result)))
            .catch(e => Promise.reject(e));
    };
}

export function recieveManagedProcessAddedAction(entities: ManagedModelDto) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveNewManaged(entities));
    };
}

export function recieveManagedProcessUpdatedAction(entities: ManagedModelDto) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveUpdateManaged(entities));
    };
}
