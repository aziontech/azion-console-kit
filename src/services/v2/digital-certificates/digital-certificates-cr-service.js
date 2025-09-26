import { BaseService } from '@/services/v2/base/query/baseService'

export class DigitalCertificatesCRService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'v4/digital_certificates/certificates/request'
  }

  createDigitalCertificateCR = async (payload) => {
    await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: payload
    })
  }
}

export const digitalCertificatesCRService = new DigitalCertificatesCRService()
