/* tslint:disable */
/* eslint-disable */
/**
 * VitalService
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  SettingsDto,
} from '../models';
import {
    SettingsDtoFromJSON,
    SettingsDtoToJSON,
} from '../models';

export interface ApiSettingsSetRunAtStartupPutRequest {
    runAtStartup?: boolean;
}

/**
 * 
 */
export class SettingsApi extends runtime.BaseAPI {

    /**
     */
    async apiSettingsGetRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SettingsDto>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/api/Settings`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => SettingsDtoFromJSON(jsonValue));
    }

    /**
     */
    async apiSettingsGet(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SettingsDto> {
        const response = await this.apiSettingsGetRaw(initOverrides);
        return await response.value();
    }

    /**
     */
    async apiSettingsSetRunAtStartupPutRaw(requestParameters: ApiSettingsSetRunAtStartupPutRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        const queryParameters: any = {};

        if (requestParameters.runAtStartup !== undefined) {
            queryParameters['runAtStartup'] = requestParameters.runAtStartup;
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/api/Settings/SetRunAtStartup`,
            method: 'PUT',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async apiSettingsSetRunAtStartupPut(requestParameters: ApiSettingsSetRunAtStartupPutRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.apiSettingsSetRunAtStartupPutRaw(requestParameters, initOverrides);
    }

}
