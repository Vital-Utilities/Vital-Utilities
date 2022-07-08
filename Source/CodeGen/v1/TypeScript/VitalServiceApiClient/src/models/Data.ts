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
 * @interface Data
 */
export interface Data {
    /**
     * 
     * @type {number}
     * @memberof Data
     */
    dataReadBytes: number | null;
    /**
     * 
     * @type {number}
     * @memberof Data
     */
    dataWrittenBytes: number | null;
}

/**
 * Check if a given object implements the Data interface.
 */
export function instanceOfData(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "dataReadBytes" in value;
    isInstance = isInstance && "dataWrittenBytes" in value;

    return isInstance;
}

export function DataFromJSON(json: any): Data {
    return DataFromJSONTyped(json, false);
}

export function DataFromJSONTyped(json: any, ignoreDiscriminator: boolean): Data {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'dataReadBytes': json['dataReadBytes'],
        'dataWrittenBytes': json['dataWrittenBytes'],
    };
}

export function DataToJSON(value?: Data | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'dataReadBytes': value.dataReadBytes,
        'dataWrittenBytes': value.dataWrittenBytes,
    };
}

