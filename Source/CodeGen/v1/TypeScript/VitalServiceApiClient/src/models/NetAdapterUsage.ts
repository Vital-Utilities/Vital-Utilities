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
    sendBps: number;
    /**
     * 
     * @type {number}
     * @memberof NetAdapterUsage
     */
    recieveBps: number;
    /**
     * 
     * @type {number}
     * @memberof NetAdapterUsage
     */
    sentBytes: number;
    /**
     * 
     * @type {number}
     * @memberof NetAdapterUsage
     */
    recievedBytes: number;
    /**
     * 
     * @type {number}
     * @memberof NetAdapterUsage
     */
    usagePercentage?: number;
}

/**
 * Check if a given object implements the NetAdapterUsage interface.
 */
export function instanceOfNetAdapterUsage(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "sendBps" in value;
    isInstance = isInstance && "recieveBps" in value;
    isInstance = isInstance && "sentBytes" in value;
    isInstance = isInstance && "recievedBytes" in value;

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
        
        'sendBps': json['sendBps'],
        'recieveBps': json['recieveBps'],
        'sentBytes': json['sentBytes'],
        'recievedBytes': json['recievedBytes'],
        'usagePercentage': !exists(json, 'usagePercentage') ? undefined : json['usagePercentage'],
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
        
        'sendBps': value.sendBps,
        'recieveBps': value.recieveBps,
        'sentBytes': value.sentBytes,
        'recievedBytes': value.recievedBytes,
        'usagePercentage': value.usagePercentage,
    };
}

