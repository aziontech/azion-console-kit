export class DigitalCertificatesCSRService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/digital_certificates/csr'
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
