import * as vitalservice from "@vital/vitalservice";

const config = new vitalservice.Configuration({ basePath: "", headers: { "X-CSRF": "1" } });

export const settingsApi = new vitalservice.SettingsApi(config);

export const systemApi = new vitalservice.SystemApi(config);

export const profileApi = new vitalservice.ProfileApi(config);

export const processApi = new vitalservice.ProcessApi(config);

export const helloApi = new vitalservice.HelloApi(config);
