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

import { exists, mapValues } from '../runtime';
import type { CpuData } from './CpuData';
import {
    CpuDataFromJSON,
    CpuDataFromJSONTyped,
    CpuDataToJSON,
} from './CpuData';
import type { GpuData } from './GpuData';
import {
    GpuDataFromJSON,
    GpuDataFromJSONTyped,
    GpuDataToJSON,
} from './GpuData';
import type { RamData } from './RamData';
import {
    RamDataFromJSON,
    RamDataFromJSONTyped,
    RamDataToJSON,
} from './RamData';

/**
 * 
 * @export
 * @interface GetMachineStaticDataResponse
 */
export interface GetMachineStaticDataResponse {
    /**
     * 
     * @type {string}
     * @memberof GetMachineStaticDataResponse
     */
    directXVersion?: string | null;
    /**
     * 
     * @type {CpuData}
     * @memberof GetMachineStaticDataResponse
     */
    cpu?: CpuData;
    /**
     * 
     * @type {Array<RamData>}
     * @memberof GetMachineStaticDataResponse
     */
    ram?: Array<RamData> | null;
    /**
     * 
     * @type {Array<GpuData>}
     * @memberof GetMachineStaticDataResponse
     */
    gpu?: Array<GpuData> | null;
}

/**
 * Check if a given object implements the GetMachineStaticDataResponse interface.
 */
export function instanceOfGetMachineStaticDataResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function GetMachineStaticDataResponseFromJSON(json: any): GetMachineStaticDataResponse {
    return GetMachineStaticDataResponseFromJSONTyped(json, false);
}

export function GetMachineStaticDataResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetMachineStaticDataResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'directXVersion': !exists(json, 'directXVersion') ? undefined : json['directXVersion'],
        'cpu': !exists(json, 'cpu') ? undefined : CpuDataFromJSON(json['cpu']),
        'ram': !exists(json, 'ram') ? undefined : (json['ram'] === null ? null : (json['ram'] as Array<any>).map(RamDataFromJSON)),
        'gpu': !exists(json, 'gpu') ? undefined : (json['gpu'] === null ? null : (json['gpu'] as Array<any>).map(GpuDataFromJSON)),
    };
}

export function GetMachineStaticDataResponseToJSON(value?: GetMachineStaticDataResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'directXVersion': value.directXVersion,
        'cpu': CpuDataToJSON(value.cpu),
        'ram': value.ram === undefined ? undefined : (value.ram === null ? null : (value.ram as Array<any>).map(RamDataToJSON)),
        'gpu': value.gpu === undefined ? undefined : (value.gpu === null ? null : (value.gpu as Array<any>).map(GpuDataToJSON)),
    };
}

