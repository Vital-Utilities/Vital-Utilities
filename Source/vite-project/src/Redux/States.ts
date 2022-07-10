import { GetMachineStaticDataResponse, GetMachineDynamicDataResponse, TimeSeriesMachineMetricsResponse, ManagedModelDto, GetRunningProcessesResponse, ProfileDto, SettingsDto } from "@vital/vitalservice";

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
export interface VitalState {
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

export const InitialState: VitalState = {
    machineState: {
        static: undefined,
        dynamic: undefined
    },
    managedState: { managed: [] },
    processViewState: { processView: {} },
    profileState: { profiles: [] },
    appState: { appReady: false, signalRConnected: false, httpConnected: false, vitalServicePort: 50030 },
    //@ts-ignore
    settingsState: { settings: undefined }
};
