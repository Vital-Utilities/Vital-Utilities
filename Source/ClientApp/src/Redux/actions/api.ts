import * as vitalservice from "@vital/vitalservice";
import { PortNumber } from "../../App";
const config = new vitalservice.Configuration({ basePath: `http://localhost:${PortNumber}`, headers: { "X-CSRF": "1" } });

const settingsApi = new vitalservice.SettingsApi(config);

const systemApi = new vitalservice.SystemApi(config);

const profileApi = new vitalservice.ProfileApi(config);

const processApi = new vitalservice.ProcessApi(config);

const helloApi = new vitalservice.HelloApi(config);
// export default everything
export default { config, settingsApi, systemApi, profileApi, processApi, helloApi };
