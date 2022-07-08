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
/**
 * 
 * @export
 * @interface NetAdapterUsage
 */
export interface NetAdapterUsage {
    /**
     * 
     * @type {number}
     * @memberof NetAdapterUsage
     */
    uploadSpeedBps: number;
    /**
     * 
     * @type {number}
     * @memberof NetAdapterUsage
     */
    downloadSpeedBps: number;
    /**
     * 
     * @type {number}
     * @memberof NetAdapterUsage
     */
    uploadedBps: number;
    /**
     * 
     * @type {number}
     * @memberof NetAdapterUsage
     */
    downloadedBps: number;
    /**
     * 
     * @type {number}
     * @memberof NetAdapterUsage
     */
    usagePercentage: number;
}

/**
 * Check if a given object implements the NetAdapterUsage interface.
 */
export function instanceOfNetAdapterUsage(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "uploadSpeedBps" in value;
    isInstance = isInstance && "downloadSpeedBps" in value;
    isInstance = isInstance && "uploadedBps" in value;
    isInstance = isInstance && "downloadedBps" in value;
    isInstance = isInstance && "usagePercentage" in value;

    return isInstance;
}

export function NetAdapterUsageFromJSON(json: any): NetAdapterUsage {
    return NetAdapterUsageFromJSONTyped(json, false);
}

export function NetAdapterUsageFromJSONTyped(json: any, ignoreDiscriminator: boolean): NetAdapterUsage {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'uploadSpeedBps': json['uploadSpeedBps'],
        'downloadSpeedBps': json['downloadSpeedBps'],
        'uploadedBps': json['uploadedBps'],
        'downloadedBps': json['downloadedBps'],
        'usagePercentage': json['usagePercentage'],
    };
}

export function NetAdapterUsageToJSON(value?: NetAdapterUsage | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'uploadSpeedBps': value.uploadSpeedBps,
        'downloadSpeedBps': value.downloadSpeedBps,
        'uploadedBps': value.uploadedBps,
        'downloadedBps': value.downloadedBps,
        'usagePercentage': value.usagePercentage,
    };
}

