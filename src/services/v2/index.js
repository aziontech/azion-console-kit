import { createHttpService } from './base/httpServiceFactory'

// Services
import { VcsService } from './vcs-service'
import { VcsAdapter } from './adapters/vcs-adapter'

const httpService = createHttpService()

const vcsService = new VcsService(httpService, VcsAdapter)

export { vcsService }
