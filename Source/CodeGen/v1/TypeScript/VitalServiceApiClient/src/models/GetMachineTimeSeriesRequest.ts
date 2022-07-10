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
 * @interface GetMachineTimeSeriesRequest
 */
export interface GetMachineTimeSeriesRequest {
    /**
     * 
     * @type {Date}
     * @memberof GetMachineTimeSeriesRequest
     */
    earliest: Date;
    /**
     * 
     * @type {Date}
     * @memberof GetMachineTimeSeriesRequest
     */
    latest: Date;
}

/**
 * Check if a given object implements the GetMachineTimeSeriesRequest interface.
 */
export function instanceOfGetMachineTimeSeriesRequest(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "earliest" in value;
    isInstance = isInstance && "latest" in value;

    return isInstance;
}

export function GetMachineTimeSeriesRequestFromJSON(json: any): GetMachineTimeSeriesRequest {
    return GetMachineTimeSeriesRequestFromJSONTyped(json, false);
}

export function GetMachineTimeSeriesRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetMachineTimeSeriesRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'earliest': (new Date(json['earliest'])),
        'latest': (new Date(json['latest'])),
    };
}

export function GetMachineTimeSeriesRequestToJSON(value?: GetMachineTimeSeriesRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'earliest': (value.earliest.toISOString()),
        'latest': (value.latest.toISOString()),
    };
}

