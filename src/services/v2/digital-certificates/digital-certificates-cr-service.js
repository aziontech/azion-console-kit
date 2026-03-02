import { BaseService } from '@/services/v2/base/query/baseService'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export class DigitalCertificatesCRService extends BaseService {
  constructor() {
    super()
    this.baseURL = 'v4/workspace/tls/certificates/request'
  }

  createDigitalCertificateCR = async (payload) => {
    await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: payload
    })

    this.queryClient.removeQueries({ queryKey: queryKeys.digitalCertificates.all })
  }
}

export const digitalCertificatesCRService = new DigitalCertificatesCRService()
