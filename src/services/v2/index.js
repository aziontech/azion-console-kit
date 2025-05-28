import { createHttpService } from './base/httpServiceFactory'

// Services
import { VcsService } from './vcs-service'
import { VcsAdapter } from './adapters/vcs-adapter'
import { WafService } from './waf-service'
import { WafAdapter } from './adapters/waf-adapter'

const httpService = createHttpService()
const vcsService = new VcsService(httpService, VcsAdapter)
const wafService = new WafService(httpService, WafAdapter)

export { vcsService, wafService }
