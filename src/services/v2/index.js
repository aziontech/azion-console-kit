import { createHttpService } from './base/httpServiceFactory'

// Services
import { VcsService } from './vcs-service'
import { VcsAdapter } from './adapters/vcs-adapter'
import { NetworkListsService } from './network-lists-service'
import { NetworkListsAdapter } from './adapters/network-lists-adapter'

const httpService = createHttpService()

const vcsService = new VcsService(httpService, VcsAdapter)
const networkListsService = new NetworkListsService(httpService, NetworkListsAdapter)

export { vcsService, networkListsService }
