export class DigitalCertificatesService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/digital_certificates/certificates'
  }

  createDigitalCertificate = async (payload) => {
    const body = this.adapter?.transformCreateDigitalCertificate?.(payload)

    const { data } = await this.http.request({
      method: 'POST',
      url: this.baseURL,
      body
    })

    const {
      data: { id }
    } = data

    return {
      feedback: 'Your digital certificate has been created!',
      urlToEditView: `/digital-certificates/edit/${id}`,
      domainId: id
    }
  }

  editDigitalCertificate = async (payload) => {
    console.log('payload', payload)
    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body: payload
    })

    return 'Your digital certificate has been updated!'
  }

  listDigitalCertificates = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: this.baseURL,
      params: {
        search: '',
        fields: '',
        ordering: 'name',
        page: 1,
        pageSize: 10,
        ...params
      }
    })

    return this.adapter?.transformListDigitalCertificates?.(data, params)
  }

  listDigitalCertificatesDropdown = async (params) => {
    const data = await this.listDigitalCertificates(params)
    return this.adapter?.transformListDigitalCertificatesDropdown?.(data, params)
  }

  loadDigitalCertificate = async ({ id }) => {
    const fields = ['id', 'name', 'type', 'csr', 'managed']

    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`,
      params: {
        fields
      }
    })

    return this.adapter?.transformLoadDigitalCertificate?.(data)
  }

  deleteDigitalCertificate = async (payload) => {
    const body = this.adapter?.transformDeleteDigitalCertificate?.(payload)

    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${payload.id}`,
      body
    })

    return 'Digital certificate successfully deleted!'
  }
}
