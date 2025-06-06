export class DigitalCertificatesCRService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
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
