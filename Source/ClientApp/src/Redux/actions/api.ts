import * as vitalservice from "@vital/vitalservice";
import { config } from "../../App";

export const settingsApi = new vitalservice.SettingsApi(config);

export const systemApi = new vitalservice.SystemApi(config);

export const profileApi = new vitalservice.ProfileApi(config);

export const processApi = new vitalservice.ProcessApi(config);

export const helloApi = new vitalservice.HelloApi(config);
// export default everything
