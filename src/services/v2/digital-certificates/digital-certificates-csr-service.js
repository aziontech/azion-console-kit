import { BaseService } from '@/services/v2/base/query/baseService'
import { DigitalCertificatesCSRAdapter } from '@/services/v2/digital-certificates/digital-certificates-csr-adapter'

export class DigitalCertificatesCSRService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'v4/digital_certificates/csr'
    this.adapter = DigitalCertificatesCSRAdapter
  }

  createDigitalCertificateCSR = async (payload) => {
    const body = this.adapter?.transformCreateDigitalCertificateCSR?.(payload)
    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    return data
  }
}

export const digitalCertificatesCSRService = new DigitalCertificatesCSRService()
