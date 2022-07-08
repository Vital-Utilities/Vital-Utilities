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
 * @interface ProcessViewDto
 */
export interface ProcessViewDto {
    /**
     * 
     * @type {string}
     * @memberof ProcessViewDto
     */
    processName?: string;
    /**
     * 
     * @type {string}
     * @memberof ProcessViewDto
     */
    processTitle?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ProcessViewDto
     */
    description?: string | null;
    /**
     * 
     * @type {number}
     * @memberof ProcessViewDto
     */
    id?: number;
}

/**
 * Check if a given object implements the ProcessViewDto interface.
 */
export function instanceOfProcessViewDto(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ProcessViewDtoFromJSON(json: any): ProcessViewDto {
    return ProcessViewDtoFromJSONTyped(json, false);
}

export function ProcessViewDtoFromJSONTyped(json: any, ignoreDiscriminator: boolean): ProcessViewDto {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'processName': !exists(json, 'processName') ? undefined : json['processName'],
        'processTitle': !exists(json, 'processTitle') ? undefined : json['processTitle'],
        'description': !exists(json, 'description') ? undefined : json['description'],
        'id': !exists(json, 'id') ? undefined : json['id'],
    };
}

export function ProcessViewDtoToJSON(value?: ProcessViewDto | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'processName': value.processName,
        'processTitle': value.processTitle,
        'description': value.description,
        'id': value.id,
    };
}

