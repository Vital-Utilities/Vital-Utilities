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
import type { ManagedModelDto } from './ManagedModelDto';
import {
    ManagedModelDtoFromJSON,
    ManagedModelDtoFromJSONTyped,
    ManagedModelDtoToJSON,
} from './ManagedModelDto';

/**
 * 
 * @export
 * @interface GetManagedResponse
 */
export interface GetManagedResponse {
    /**
     * 
     * @type {Array<ManagedModelDto>}
     * @memberof GetManagedResponse
     */
    affinityModels?: Array<ManagedModelDto> | null;
}

/**
 * Check if a given object implements the GetManagedResponse interface.
 */
export function instanceOfGetManagedResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function GetManagedResponseFromJSON(json: any): GetManagedResponse {
    return GetManagedResponseFromJSONTyped(json, false);
}

export function GetManagedResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetManagedResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'affinityModels': !exists(json, 'affinityModels') ? undefined : (json['affinityModels'] === null ? null : (json['affinityModels'] as Array<any>).map(ManagedModelDtoFromJSON)),
    };
}

export function GetManagedResponseToJSON(value?: GetManagedResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'affinityModels': value.affinityModels === undefined ? undefined : (value.affinityModels === null ? null : (value.affinityModels as Array<any>).map(ManagedModelDtoToJSON)),
    };
}

