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


/**
 * 
 * @export
 */
export const DiskType = {
    Unknown: 'Unknown',
    Hdd: 'HDD',
    Ssd: 'SSD'
} as const;
export type DiskType = typeof DiskType[keyof typeof DiskType];


export function DiskTypeFromJSON(json: any): DiskType {
    return DiskTypeFromJSONTyped(json, false);
}

export function DiskTypeFromJSONTyped(json: any, ignoreDiscriminator: boolean): DiskType {
    return json as DiskType;
}

export function DiskTypeToJSON(value?: DiskType | null): any {
    return value as any;
}

