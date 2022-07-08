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
import type { NetworkAdapter } from './NetworkAdapter';
import {
    NetworkAdapterFromJSON,
    NetworkAdapterFromJSONTyped,
    NetworkAdapterToJSON,
} from './NetworkAdapter';

/**
 * 
 * @export
 * @interface NetworkAdapters
 */
export interface NetworkAdapters {
    /**
     * 
     * @type {{ [key: string]: NetworkAdapter; }}
     * @memberof NetworkAdapters
     */
    adapters: { [key: string]: NetworkAdapter; };
}

/**
 * Check if a given object implements the NetworkAdapters interface.
 */
export function instanceOfNetworkAdapters(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "adapters" in value;

    return isInstance;
}

export function NetworkAdaptersFromJSON(json: any): NetworkAdapters {
    return NetworkAdaptersFromJSONTyped(json, false);
}

export function NetworkAdaptersFromJSONTyped(json: any, ignoreDiscriminator: boolean): NetworkAdapters {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'adapters': (mapValues(json['adapters'], NetworkAdapterFromJSON)),
    };
}

export function NetworkAdaptersToJSON(value?: NetworkAdapters | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'adapters': (mapValues(value.adapters, NetworkAdapterToJSON)),
    };
}

