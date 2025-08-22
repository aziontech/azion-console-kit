import { hasFlagBlockApiV4 } from '@/composables/user-flag'

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

    return data
  }

  createDigitalCertificateLetEncrypt = async (payload, sourceCertificate) => {
    // USAR ESSE METODO PARA HTTP-01
    const body = this.adapter?.transformCreateDigitalCertificateLetEncrypt?.(
      payload,
      sourceCertificate
    )

    const { data: response } = await this.http.request({
      method: 'POST',
      url: `${this.baseURL}/request`,
      body,
      processError: false
    })

    if (response?.meta?.certificate) {
      return { id: response.meta.certificate }
    }

    if (response?.meta) {
      throw response.error()
    }

    return response.data
  }

  editDigitalCertificate = async (payload) => {
    const body = this.adapter?.transformEditDigitalCertificate?.(payload)

    await this.http.request({
      method: 'PUT',
      url: `${this.baseURL}/${payload.id}`,
      body
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

    if (hasFlagBlockApiV4())
      return this.adapter?.transformListDigitalCertificatesDropdownToDomains?.(data, params)

    return this.adapter?.transformListDigitalCertificatesDropdownToWorkloads?.(data, params)
  }

  loadDigitalCertificate = async ({ id }) => {
    const fields = ['id', 'name', 'type', 'authority', 'csr', 'managed', 'certificate', 'status']

    const { data } = await this.http.request({
      method: 'GET',
      url: `${this.baseURL}/${id}`,
      params: {
        fields
      }
    })

    return this.adapter?.transformLoadDigitalCertificate?.(data)
  }

  deleteDigitalCertificate = async (id) => {
    await this.http.request({
      method: 'DELETE',
      url: `${this.baseURL}/${id}`
    })

    return 'Digital certificate successfully deleted!'
  }
}
