import { BaseService } from '@/services/v2/base/query/baseService'
import { DigitalCertificatesCSRAdapter } from '@/services/v2/digital-certificates/digital-certificates-csr-adapter'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class DigitalCertificatesCSRService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'v4/workspace/tls/csr'
    this.adapter = DigitalCertificatesCSRAdapter
  }

  createDigitalCertificateCSR = async (payload) => {
    const body = this.adapter?.transformCreateDigitalCertificateCSR?.(payload)
    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificates.all })

    return data
  }
}

export const digitalCertificatesCSRService = new DigitalCertificatesCSRService()
