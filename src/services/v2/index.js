import { createHttpService } from './base/httpServiceFactory'

// Services
import { VcsService } from './vcs-service'
import { WorkloadService } from './workload-service'
import { DigitalCertificateService } from './digital-certificate-service'

// Adapters
import { VcsAdapter } from './adapters/vcs-adapter'
import { WorkloadAdapter } from './adapters/workload-adapter'

const httpService = createHttpService()
const vcsService = new VcsService(httpService, VcsAdapter)
const workloadService = new WorkloadService(httpService, WorkloadAdapter)
const digitalCertificateService = new DigitalCertificateService(httpService)

export { vcsService, workloadService, digitalCertificateService }
