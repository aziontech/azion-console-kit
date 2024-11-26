import { listDeviceGroupsService } from './list-device-groups-service'
import { createDeviceGroupService } from './create-device-groups-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listDeviceGroupsService} listDeviceGroupsService - The listDeviceGroupsService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listDeviceGroupsService, createDeviceGroupService }
