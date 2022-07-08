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
 * @interface GpuUsageMetricModel
 */
export interface GpuUsageMetricModel {
    /**
     * 
     * @type {number}
     * @memberof GpuUsageMetricModel
     */
    id?: number;
    /**
     * 
     * @type {string}
     * @memberof GpuUsageMetricModel
     */
    uniqueIdentifier?: string | null;
    /**
     * 
     * @type {number}
     * @memberof GpuUsageMetricModel
     */
    coreUsagePercentage?: number | null;
    /**
     * 
     * @type {number}
     * @memberof GpuUsageMetricModel
     */
    vramUsageBytes?: number | null;
    /**
     * 
     * @type {number}
     * @memberof GpuUsageMetricModel
     */
    vramTotalBytes?: number | null;
    /**
     * 
     * @type {number}
     * @memberof GpuUsageMetricModel
     */
    coreTemperature?: number | null;
    /**
     * 
     * @type {number}
     * @memberof GpuUsageMetricModel
     */
    powerDrawWattage?: number | null;
    /**
     * 
     * @type {{ [key: string]: number; }}
     * @memberof GpuUsageMetricModel
     */
    fanPercentage?: { [key: string]: number; } | null;
}

/**
 * Check if a given object implements the GpuUsageMetricModel interface.
 */
export function instanceOfGpuUsageMetricModel(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function GpuUsageMetricModelFromJSON(json: any): GpuUsageMetricModel {
    return GpuUsageMetricModelFromJSONTyped(json, false);
}

export function GpuUsageMetricModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): GpuUsageMetricModel {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': !exists(json, 'id') ? undefined : json['id'],
        'uniqueIdentifier': !exists(json, 'uniqueIdentifier') ? undefined : json['uniqueIdentifier'],
        'coreUsagePercentage': !exists(json, 'coreUsagePercentage') ? undefined : json['coreUsagePercentage'],
        'vramUsageBytes': !exists(json, 'vramUsageBytes') ? undefined : json['vramUsageBytes'],
        'vramTotalBytes': !exists(json, 'vramTotalBytes') ? undefined : json['vramTotalBytes'],
        'coreTemperature': !exists(json, 'coreTemperature') ? undefined : json['coreTemperature'],
        'powerDrawWattage': !exists(json, 'powerDrawWattage') ? undefined : json['powerDrawWattage'],
        'fanPercentage': !exists(json, 'fanPercentage') ? undefined : json['fanPercentage'],
    };
}

export function GpuUsageMetricModelToJSON(value?: GpuUsageMetricModel | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'uniqueIdentifier': value.uniqueIdentifier,
        'coreUsagePercentage': value.coreUsagePercentage,
        'vramUsageBytes': value.vramUsageBytes,
        'vramTotalBytes': value.vramTotalBytes,
        'coreTemperature': value.coreTemperature,
        'powerDrawWattage': value.powerDrawWattage,
        'fanPercentage': value.fanPercentage,
    };
}

