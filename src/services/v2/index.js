import { createHttpService } from './base/httpServiceFactory'

// Services
import { VcsAdapter } from './adapters/vcs-adapter'
import { DigitalCertificatesAdapter } from './adapters/digital-certificates-adapter'

import { VcsService } from './vcs-service'
import { DigitalCertificatesService } from './digital-certificates-service'

const httpService = createHttpService()

const vcsService = new VcsService(httpService, VcsAdapter)
const digitalCertificatesService = new DigitalCertificatesService(
  httpService,
  DigitalCertificatesAdapter
)

export { vcsService, digitalCertificatesService }
