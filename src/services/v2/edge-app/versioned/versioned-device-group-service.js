import { createVersionedSubResourceService } from './create-versioned-sub-resource-service'
import { DeviceGroupAdapter } from '@/services/v2/edge-app/edge-app-device-group-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export const versionedDeviceGroupService = createVersionedSubResourceService({
  path: 'device_groups',
  adapter: {
    transformList: (results) => DeviceGroupAdapter.transformListDeviceGroup(results),
    transformLoad: (data) => DeviceGroupAdapter.transformLoadDeviceGroup(data),
    requestPayload: (payload) => DeviceGroupAdapter.transformPayload(payload)
  },
  queryKeyGroup: queryKeys.application.version.deviceGroups
})
