import { createHttpService } from './base/httpServiceFactory'

// Services
import { VcsService } from './vcs-service'
import { PurgeService } from './purge-service'

// Adapters
import { VcsAdapter } from './adapters/vcs-adapter'
import { PurgeAdapter } from './adapters/purge-adapter'

const httpService = createHttpService()

const vcsService = new VcsService(httpService, VcsAdapter)
const purgeService = new PurgeService(httpService, PurgeAdapter)

export { vcsService, purgeService }
