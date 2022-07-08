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
 * @interface ProcessDiskUsage
 */
export interface ProcessDiskUsage {
    /**
     * 
     * @type {number}
     * @memberof ProcessDiskUsage
     */
    readBytesPerSecond: number;
    /**
     * 
     * @type {number}
     * @memberof ProcessDiskUsage
     */
    writeBytesPerSecond: number;
}

/**
 * Check if a given object implements the ProcessDiskUsage interface.
 */
export function instanceOfProcessDiskUsage(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "readBytesPerSecond" in value;
    isInstance = isInstance && "writeBytesPerSecond" in value;

    return isInstance;
}

export function ProcessDiskUsageFromJSON(json: any): ProcessDiskUsage {
    return ProcessDiskUsageFromJSONTyped(json, false);
}

export function ProcessDiskUsageFromJSONTyped(json: any, ignoreDiscriminator: boolean): ProcessDiskUsage {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'readBytesPerSecond': json['readBytesPerSecond'],
        'writeBytesPerSecond': json['writeBytesPerSecond'],
    };
}

export function ProcessDiskUsageToJSON(value?: ProcessDiskUsage | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'readBytesPerSecond': value.readBytesPerSecond,
        'writeBytesPerSecond': value.writeBytesPerSecond,
    };
}

