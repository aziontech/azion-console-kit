import { AxiosHttpClientAdapter } from './AxiosHttpClientAdapter'

export class AxiosHttpClientSignalDecorator {
  constructor(signal) {
    this.signal = signal
  }

  async request({ url, method, headers, body }) {
    return await AxiosHttpClientAdapter.request({
      url,
      method,
      headers,
      body,
      signal: this.signal
    })
  }
}
