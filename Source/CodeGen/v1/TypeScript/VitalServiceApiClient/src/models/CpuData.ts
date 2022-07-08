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
 * @interface CpuData
 */
export interface CpuData {
    /**
     * 
     * @type {string}
     * @memberof CpuData
     */
    name: string;
    /**
     * 
     * @type {number}
     * @memberof CpuData
     */
    numberOfEnabledCore: number;
    /**
     * 
     * @type {number}
     * @memberof CpuData
     */
    numberOfCores: number;
    /**
     * 
     * @type {number}
     * @memberof CpuData
     */
    threadCount: number;
    /**
     * 
     * @type {boolean}
     * @memberof CpuData
     */
    virtualizationFirmwareEnabled: boolean;
    /**
     * 
     * @type {number}
     * @memberof CpuData
     */
    l1CacheSize: number;
    /**
     * 
     * @type {number}
     * @memberof CpuData
     */
    l2CacheSize: number;
    /**
     * 
     * @type {number}
     * @memberof CpuData
     */
    l3CacheSize: number;
}

/**
 * Check if a given object implements the CpuData interface.
 */
export function instanceOfCpuData(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "name" in value;
    isInstance = isInstance && "numberOfEnabledCore" in value;
    isInstance = isInstance && "numberOfCores" in value;
    isInstance = isInstance && "threadCount" in value;
    isInstance = isInstance && "virtualizationFirmwareEnabled" in value;
    isInstance = isInstance && "l1CacheSize" in value;
    isInstance = isInstance && "l2CacheSize" in value;
    isInstance = isInstance && "l3CacheSize" in value;

    return isInstance;
}

export function CpuDataFromJSON(json: any): CpuData {
    return CpuDataFromJSONTyped(json, false);
}

export function CpuDataFromJSONTyped(json: any, ignoreDiscriminator: boolean): CpuData {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': json['name'],
        'numberOfEnabledCore': json['numberOfEnabledCore'],
        'numberOfCores': json['numberOfCores'],
        'threadCount': json['threadCount'],
        'virtualizationFirmwareEnabled': json['virtualizationFirmwareEnabled'],
        'l1CacheSize': json['l1CacheSize'],
        'l2CacheSize': json['l2CacheSize'],
        'l3CacheSize': json['l3CacheSize'],
    };
}

export function CpuDataToJSON(value?: CpuData | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'numberOfEnabledCore': value.numberOfEnabledCore,
        'numberOfCores': value.numberOfCores,
        'threadCount': value.threadCount,
        'virtualizationFirmwareEnabled': value.virtualizationFirmwareEnabled,
        'l1CacheSize': value.l1CacheSize,
        'l2CacheSize': value.l2CacheSize,
        'l3CacheSize': value.l3CacheSize,
    };
}

