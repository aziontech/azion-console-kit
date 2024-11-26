import { listDeviceGroupsService } from './list-device-groups-service'
import { editDeviceGroupService } from './edit-device-groups-service'
import { loadDeviceGroupService } from './load-device-group-service'

/**
 * @typedef {Object} ExportedServicesType - The type of the exported services
 * @property {typeof listDeviceGroupsService} listDeviceGroupsService - The listDeviceGroupsService reference
 */

/**
 * @type {ExportedServicesType}
 */
export { listDeviceGroupsService, editDeviceGroupService, loadDeviceGroupService }
