import { AxiosHttpClientAdapter } from './AxiosHttpClientAdapter'
import axios from 'axios'

axios.defaults.headers.common['Content-Type'] = 'application/json; version=3'

export class AxiosHttpClientSignalDecorator {
  constructor(signal) {
    this.signal = signal
  }

  async request({ url, method, headers, body }) {
    return await AxiosHttpClientAdapter.request(
      {
        url,
        method,
        headers,
        body,
        signal: this.signal
      },
      axios
    )
  }
}
