export class DigitalCertificatesService {
  constructor(http, adapter) {
    this.http = http
    this.adapter = adapter
    this.baseURL = 'v4/digital_certificates'
  }

  listDigitalCertificates = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/certificates`,
      params: {
        search: '',
        fields: '',
        ordering: 'name',
        page: 1,
        pageSize: 10,
        ...params
      }
    })

    return this.adapter?.transformListDigitalCertificates?.(data)
  }

  listDigitalCertificatesDropdown = async (params) => {
    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/certificates`,
      params
    })

    return this.adapter?.transformListDigitalCertificatesDropdown?.(data, params)
  }

  loadDigitalCertificate = async ({ id }) => {
    const fields = ['id', 'name', 'type', 'csr', 'managed']

    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/certificates/${id}`,
      params: {
        fields
      }
    })

    return this.adapter?.transformLoadDigitalCertificate?.(data)
  }
}
