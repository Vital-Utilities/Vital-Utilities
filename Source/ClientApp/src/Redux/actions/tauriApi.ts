/**
 * Tauri API module - replaces HTTP-based API calls with Tauri invoke commands
 * This module provides the same interface as the generated vitalservice API
 * but uses Tauri IPC instead of HTTP requests.
 */

import { invoke } from "@tauri-apps/api/core";
import type { GetMachineDynamicDataResponse, GetMachineStaticDataResponse, GetMachineTimeSeriesRequest, TimeSeriesMachineMetricsResponse, GetRunningProcessesResponse, GetManagedResponse, GetAllResponse, GetProcessesToAddResponse, ProfileDto, ManagedModelDto, SettingsDto, UpdateProfileRequest, AddProccessRequest, UpdateManagedRequest } from "@vital/vitalservice";

// ============================================================================
// System API
// ============================================================================

export const systemApi = {
    async getStatic(): Promise<GetMachineStaticDataResponse> {
        return invoke<GetMachineStaticDataResponse>("get_system_static");
    },

    async getDynamic(): Promise<GetMachineDynamicDataResponse> {
        return invoke<GetMachineDynamicDataResponse>("get_system_dynamic");
    },

    async getTimeseries(request: GetMachineTimeSeriesRequest): Promise<TimeSeriesMachineMetricsResponse> {
        return invoke<TimeSeriesMachineMetricsResponse>("get_system_timeseries", { request });
    }
};

// ============================================================================
// Process API
// ============================================================================

export const processApi = {
    async getAll(): Promise<GetAllResponse> {
        return invoke<GetAllResponse>("get_processes");
    },

    async getManaged(): Promise<GetManagedResponse> {
        return invoke<GetManagedResponse>("get_managed_processes");
    },

    async getRunning(): Promise<GetRunningProcessesResponse> {
        return invoke<GetRunningProcessesResponse>("get_running_processes");
    },

    async getProcessesToAdd(): Promise<GetProcessesToAddResponse> {
        return invoke<GetProcessesToAddResponse>("get_processes_to_add");
    },

    async kill(id: number): Promise<void> {
        return invoke<void>("kill_process", { id });
    },

    async openPath(id: number): Promise<void> {
        return invoke<void>("open_process_path", { id });
    }
};

// ============================================================================
// Profile API
// ============================================================================

export const profileApi = {
    async getAll(): Promise<ProfileDto[]> {
        return invoke<ProfileDto[]>("get_all_profiles");
    },

    async getById(id: number): Promise<ProfileDto> {
        return invoke<ProfileDto>("get_profile", { id });
    },

    async create(name: string): Promise<ProfileDto> {
        return invoke<ProfileDto>("create_profile", { name });
    },

    async update(request: UpdateProfileRequest): Promise<void> {
        return invoke<void>("update_profile", { request });
    },

    async delete(id: number): Promise<void> {
        return invoke<void>("delete_profile", { id });
    },

    async addProcessConfig(request: AddProccessRequest): Promise<ManagedModelDto> {
        return invoke<ManagedModelDto>("add_process_config", { request });
    },

    async updateProcessConfig(request: UpdateManagedRequest): Promise<void> {
        return invoke<void>("update_process_config", { request });
    },

    async deleteProcessConfig(id: number): Promise<void> {
        return invoke<void>("delete_process_config", { id });
    }
};

// ============================================================================
// Settings API
// ============================================================================

export const settingsApi = {
    async get(): Promise<SettingsDto> {
        return invoke<SettingsDto>("get_settings");
    },

    async update(settings: SettingsDto): Promise<void> {
        return invoke<void>("update_settings", { settings });
    },

    async setRunAtStartup(enabled: boolean): Promise<void> {
        return invoke<void>("set_run_at_startup", { enabled });
    }
};

// ============================================================================
// Hello API (health check)
// ============================================================================

export const helloApi = {
    async hello(): Promise<string> {
        return invoke<string>("api_hello");
    }
};
