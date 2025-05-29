export class DigitalCertificateService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/digital_certificates'
  }

  listDigitalCertificatesCRLDropDown = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/crls`,
      params
    })

    return data
  }

  loadDigitalCertificatesCRLDropDown = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/crls/${params.id}`,
      params
    })

    return data
  }
}
