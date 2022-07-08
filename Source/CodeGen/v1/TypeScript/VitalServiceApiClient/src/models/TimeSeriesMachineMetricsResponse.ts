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
import type { DateRange } from './DateRange';
import {
    DateRangeFromJSON,
    DateRangeFromJSONTyped,
    DateRangeToJSON,
} from './DateRange';
import type { TimeSeriesMachineMetricsModel } from './TimeSeriesMachineMetricsModel';
import {
    TimeSeriesMachineMetricsModelFromJSON,
    TimeSeriesMachineMetricsModelFromJSONTyped,
    TimeSeriesMachineMetricsModelToJSON,
} from './TimeSeriesMachineMetricsModel';

/**
 * 
 * @export
 * @interface TimeSeriesMachineMetricsResponse
 */
export interface TimeSeriesMachineMetricsResponse {
    /**
     * 
     * @type {DateRange}
     * @memberof TimeSeriesMachineMetricsResponse
     */
    requestRange?: DateRange;
    /**
     * 
     * @type {Array<TimeSeriesMachineMetricsModel>}
     * @memberof TimeSeriesMachineMetricsResponse
     */
    metrics?: Array<TimeSeriesMachineMetricsModel> | null;
}

/**
 * Check if a given object implements the TimeSeriesMachineMetricsResponse interface.
 */
export function instanceOfTimeSeriesMachineMetricsResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function TimeSeriesMachineMetricsResponseFromJSON(json: any): TimeSeriesMachineMetricsResponse {
    return TimeSeriesMachineMetricsResponseFromJSONTyped(json, false);
}

export function TimeSeriesMachineMetricsResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): TimeSeriesMachineMetricsResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'requestRange': !exists(json, 'requestRange') ? undefined : DateRangeFromJSON(json['requestRange']),
        'metrics': !exists(json, 'metrics') ? undefined : (json['metrics'] === null ? null : (json['metrics'] as Array<any>).map(TimeSeriesMachineMetricsModelFromJSON)),
    };
}

export function TimeSeriesMachineMetricsResponseToJSON(value?: TimeSeriesMachineMetricsResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'requestRange': DateRangeToJSON(value.requestRange),
        'metrics': value.metrics === undefined ? undefined : (value.metrics === null ? null : (value.metrics as Array<any>).map(TimeSeriesMachineMetricsModelToJSON)),
    };
}

