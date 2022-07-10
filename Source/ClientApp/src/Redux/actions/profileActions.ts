import { AnyAction } from "@reduxjs/toolkit";
import { ProfileDto } from "@vital/vitalservice";
import api from "./api";

export type ProfileActionTypes = FetchAllProfilesAction | AddProfileAction | UpdateProfileAction | DeleteProfileAction;
// Profile

const ADD_PROFILE = "ADD_PROFILE";
const FETCH_ALL_PROFILES = "FETCH_ALL_PROFILES";
const DELETE_PROFILE = "DELETE_PROFILES";
const UPDATE_PROFILE = "UPDATE_PROFILE";

interface FetchAllProfilesAction {
    type: typeof FETCH_ALL_PROFILES;
    message: ProfileDto[];
}
interface AddProfileAction {
    type: typeof ADD_PROFILE;
    message: ProfileDto;
}

interface UpdateProfileAction {
    type: typeof UPDATE_PROFILE;
    message: ProfileDto;
}

interface DeleteProfileAction {
    type: typeof DELETE_PROFILE;
    message: number;
}
function recieveAllProfiles(message: ProfileDto[]) {
    return { type: FETCH_ALL_PROFILES, message: message };
}
function recieveNewProfile(message: ProfileDto) {
    return { type: ADD_PROFILE, message: message };
}

function recieveUpdateProfile(message: ProfileDto) {
    return { type: UPDATE_PROFILE, message: message };
}

function recieveDeleteProfile(message: number) {
    return { type: DELETE_PROFILE, message: message };
}

export async function fetchProfiles() {
    return api.profileApi
        .apiProfileGetAllGet()
        .then(response => response)
        .catch(e => {
            return Promise.reject(e);
        });
}

export function recieveDeleteProfileAction(id: number) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveDeleteProfile(id));
    };
}

export function fetchProfilesAction(): AnyAction {
    //@ts-ignore
    return function (dispatch) {
        fetchProfiles()
            .then(result => dispatch(recieveAllProfiles(result)))
            .catch(e => console.error(e));
    };
}

export function recieveProfileAddedAction(entity: ProfileDto) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveNewProfile(entity));
    };
}

export function recieveProfileUpdatedAction(entity: ProfileDto) {
    //@ts-ignore
    return function (dispatch) {
        dispatch(recieveUpdateProfile(entity));
    };
}
