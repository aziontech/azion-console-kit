export class DigitalCertificateService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
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
