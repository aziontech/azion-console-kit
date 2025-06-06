export class DigitalCertificatesCRLService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/digital_certificates/crls'
  }

  listDigitalCertificatesCRL = async (payload) => {
    await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: payload
    })
  }

  createDigitalCertificateCRL = async (payload) => {
    await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body: payload
    })
  }

  loadDigitalCertificateCRL = async (payload) => {
    await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${payload.id}`,
      body: payload
    })
  }

  editDigitalCertificateCRL = async (payload) => {
    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body: payload
    })
  }

  deleteDigitalCertificateCRL = async (payload) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${payload.id}`,
      body: payload
    })
  }
}
