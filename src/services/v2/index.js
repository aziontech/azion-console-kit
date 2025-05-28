import { createHttpService } from './base/httpServiceFactory'

// Services
// Vcs Service
import { VcsService } from './vcs-service'
import { VcsAdapter } from './adapters/vcs-adapter'
// Edge Application Device Group
import { DeviceGroupAdapter } from './adapters/edge-app-device-group-adapter'
import { DeviceGroupService } from './edge-app-device-group-service'

const httpService = createHttpService()
const vcsService = new VcsService(httpService, VcsAdapter)
const deviceGroupService = new DeviceGroupService(httpService, DeviceGroupAdapter)

export { vcsService, deviceGroupService }
