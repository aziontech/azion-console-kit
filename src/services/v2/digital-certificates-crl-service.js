export class DigitalCertificatesCRLService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/digital_certificates/crls'
  }

  listDigitalCertificatesCRL = async (params = {}) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const body = this.adapter?.transformListDigitalCertificatesCRL(data.results)

    return { count: data.count, body }
  }

  listDigitalCertificatesCRLDropdown = async ({ params }) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params
    })

    const body = this.adapter?.transformListDigitalCertificatesCRLDropwdown(data.results)

    return { count: data.count, body }
  }

  createDigitalCertificateCRL = async (payload) => {
    const body = this.adapter?.transformCreateDigitalCertificateCRL(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    return data
  }

  loadDigitalCertificateCRL = async (payload) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${payload.id}`,
      body: payload
    })

    return this.adapter?.transformLoadDigitalCertificateCRL(data)
  }

  editDigitalCertificateCRL = async (payload) => {
    const body = this.adapter?.transformEditDigitalCertificateCRL(payload)

    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    return 'Your CRL has been updated!'
  }

  deleteDigitalCertificateCRL = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    return 'CRL successfully deleted!'
  }
}
