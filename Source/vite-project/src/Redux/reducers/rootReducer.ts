import { VitalState } from "../States";
import { combineReducers } from "@reduxjs/toolkit";
import { AppReducer } from "./appReducer";
import { ManagedReducer } from "./managedModelReducer";
import { MachineReducer } from "./machineReducer";
import { ProfileReducer } from "./profileReducer";
import { ProcessViewReducer } from "./processViewReducer";
import { SettingsReducer } from "./settingsReducer";

export const RootReducer = combineReducers<VitalState>({
    machineState: MachineReducer,
    managedState: ManagedReducer,
    processViewState: ProcessViewReducer,
    profileState: ProfileReducer,
    appState: AppReducer,
    settingsState: SettingsReducer
});
