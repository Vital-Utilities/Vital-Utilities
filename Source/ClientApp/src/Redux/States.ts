import { GetMachineStaticDataResponse, GetMachineDynamicDataResponse, ManagedModelDto, GetRunningProcessesResponse, ProfileDto, SettingsDto, TimeSeriesMachineMetricsResponse } from "../Dtos/Dto";

export interface MachineState {
    static?: GetMachineStaticDataResponse;
    dynamic?: GetMachineDynamicDataResponse;
    timeSeriesMetricsState?: TimeSeriesMachineMetricsResponse;
}
export interface ManagedState {
    managed: ManagedModelDto[];
}
export type ProcessViewState = GetRunningProcessesResponse;
export interface ProfileState {
    profiles: ProfileDto[];
}
export interface State {
    managedState: ManagedState;
    processViewState: ProcessViewState;
    profileState: ProfileState;
    machineState: MachineState;
    appState: AppState;
    settingsState: SettingsState;
}
export interface SettingsState {
    settings?: SettingsDto;
}
export interface AppState {
    appReady: boolean;
    httpConnected: boolean;
    signalRConnected: boolean;
    vitalServicePort: number | undefined;
}

export const InitialState: State = {
    machineState: {
        static: undefined,
        dynamic: undefined
    },
    managedState: { managed: [] },
    processViewState: { processView: {} },
    profileState: { profiles: [] },
    appState: { appReady: false, signalRConnected: false, httpConnected: false, vitalServicePort: 50031 },
    //@ts-ignore
    settingsState: { settings: undefined }
};
