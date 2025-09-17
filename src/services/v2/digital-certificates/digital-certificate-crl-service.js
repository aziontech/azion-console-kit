import { BaseService } from '@/services/v2/base/BaseService'

export class DigitalCertificateService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'v4/digital_certificates/crls'
  }

  listDigitalCertificatesCRL = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}`,
      params
    })

    return data
  }

  loadDigitalCertificatesCRL = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${params.id}`,
      params
    })

    return data
  }
}

export const digitalCertificateService = new DigitalCertificateService()
