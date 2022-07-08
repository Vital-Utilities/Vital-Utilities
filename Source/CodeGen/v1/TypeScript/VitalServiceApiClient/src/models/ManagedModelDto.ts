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
import type { ProcessPriorityEnum } from './ProcessPriorityEnum';
import {
    ProcessPriorityEnumFromJSON,
    ProcessPriorityEnumFromJSONTyped,
    ProcessPriorityEnumToJSON,
} from './ProcessPriorityEnum';

/**
 * 
 * @export
 * @interface ManagedModelDto
 */
export interface ManagedModelDto {
    /**
     * 
     * @type {number}
     * @memberof ManagedModelDto
     */
    id?: number;
    /**
     * 
     * @type {string}
     * @memberof ManagedModelDto
     */
    processName?: string | null;
    /**
     * 
     * @type {string}
     * @memberof ManagedModelDto
     */
    alias?: string | null;
    /**
     * 
     * @type {ProcessPriorityEnum}
     * @memberof ManagedModelDto
     */
    processPriority?: ProcessPriorityEnum;
    /**
     * 
     * @type {Array<number>}
     * @memberof ManagedModelDto
     */
    affinity?: Array<number> | null;
    /**
     * 
     * @type {number}
     * @memberof ManagedModelDto
     */
    parentProfileId?: number;
}

/**
 * Check if a given object implements the ManagedModelDto interface.
 */
export function instanceOfManagedModelDto(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ManagedModelDtoFromJSON(json: any): ManagedModelDto {
    return ManagedModelDtoFromJSONTyped(json, false);
}

export function ManagedModelDtoFromJSONTyped(json: any, ignoreDiscriminator: boolean): ManagedModelDto {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': !exists(json, 'id') ? undefined : json['id'],
        'processName': !exists(json, 'processName') ? undefined : json['processName'],
        'alias': !exists(json, 'alias') ? undefined : json['alias'],
        'processPriority': !exists(json, 'processPriority') ? undefined : ProcessPriorityEnumFromJSON(json['processPriority']),
        'affinity': !exists(json, 'affinity') ? undefined : json['affinity'],
        'parentProfileId': !exists(json, 'parentProfileId') ? undefined : json['parentProfileId'],
    };
}

export function ManagedModelDtoToJSON(value?: ManagedModelDto | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'processName': value.processName,
        'alias': value.alias,
        'processPriority': ProcessPriorityEnumToJSON(value.processPriority),
        'affinity': value.affinity,
        'parentProfileId': value.parentProfileId,
    };
}

