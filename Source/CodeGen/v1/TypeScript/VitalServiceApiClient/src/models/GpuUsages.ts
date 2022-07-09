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
import type { LoadData } from './LoadData';
import {
    LoadDataFromJSON,
    LoadDataFromJSONTyped,
    LoadDataToJSON,
} from './LoadData';
import type { PCIEThroughPut } from './PCIEThroughPut';
import {
    PCIEThroughPutFromJSON,
    PCIEThroughPutFromJSONTyped,
    PCIEThroughPutToJSON,
} from './PCIEThroughPut';

/**
 * 
 * @export
 * @interface GpuUsages
 */
export interface GpuUsages {
    /**
     * 
     * @type {string}
     * @memberof GpuUsages
     */
    name?: string;
    /**
     * 
     * @type {{ [key: string]: number; }}
     * @memberof GpuUsages
     */
    temperatureReadings: { [key: string]: number; };
    /**
     * 
     * @type {number}
     * @memberof GpuUsages
     */
    totalMemoryBytes?: number;
    /**
     * 
     * @type {number}
     * @memberof GpuUsages
     */
    memoryUsedBytes?: number;
    /**
     * 
     * @type {number}
     * @memberof GpuUsages
     */
    memoryClockMhz?: number;
    /**
     * 
     * @type {number}
     * @memberof GpuUsages
     */
    shaderClockMhz?: number;
    /**
     * 
     * @type {number}
     * @memberof GpuUsages
     */
    coreClockMhz?: number;
    /**
     * 
     * @type {{ [key: string]: number; }}
     * @memberof GpuUsages
     */
    fanPercentage?: { [key: string]: number; };
    /**
     * 
     * @type {number}
     * @memberof GpuUsages
     */
    powerDrawWatt?: number;
    /**
     * 
     * @type {LoadData}
     * @memberof GpuUsages
     */
    load?: LoadData;
    /**
     * 
     * @type {PCIEThroughPut}
     * @memberof GpuUsages
     */
    pcIe?: PCIEThroughPut;
}

/**
 * Check if a given object implements the GpuUsages interface.
 */
export function instanceOfGpuUsages(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "temperatureReadings" in value;

    return isInstance;
}

export function GpuUsagesFromJSON(json: any): GpuUsages {
    return GpuUsagesFromJSONTyped(json, false);
}

export function GpuUsagesFromJSONTyped(json: any, ignoreDiscriminator: boolean): GpuUsages {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': !exists(json, 'name') ? undefined : json['name'],
        'temperatureReadings': json['temperatureReadings'],
        'totalMemoryBytes': !exists(json, 'totalMemoryBytes') ? undefined : json['totalMemoryBytes'],
        'memoryUsedBytes': !exists(json, 'memoryUsedBytes') ? undefined : json['memoryUsedBytes'],
        'memoryClockMhz': !exists(json, 'memoryClockMhz') ? undefined : json['memoryClockMhz'],
        'shaderClockMhz': !exists(json, 'shaderClockMhz') ? undefined : json['shaderClockMhz'],
        'coreClockMhz': !exists(json, 'coreClockMhz') ? undefined : json['coreClockMhz'],
        'fanPercentage': !exists(json, 'fanPercentage') ? undefined : json['fanPercentage'],
        'powerDrawWatt': !exists(json, 'powerDrawWatt') ? undefined : json['powerDrawWatt'],
        'load': !exists(json, 'load') ? undefined : LoadDataFromJSON(json['load']),
        'pcIe': !exists(json, 'pcIe') ? undefined : PCIEThroughPutFromJSON(json['pcIe']),
    };
}

export function GpuUsagesToJSON(value?: GpuUsages | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'temperatureReadings': value.temperatureReadings,
        'totalMemoryBytes': value.totalMemoryBytes,
        'memoryUsedBytes': value.memoryUsedBytes,
        'memoryClockMhz': value.memoryClockMhz,
        'shaderClockMhz': value.shaderClockMhz,
        'coreClockMhz': value.coreClockMhz,
        'fanPercentage': value.fanPercentage,
        'powerDrawWatt': value.powerDrawWatt,
        'load': LoadDataToJSON(value.load),
        'pcIe': PCIEThroughPutToJSON(value.pcIe),
    };
}

