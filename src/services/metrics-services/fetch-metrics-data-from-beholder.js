import axios from 'axios'
const baseURL = '/metrics/graphql'

axios.defaults.headers.common['Content-Type'] = 'application/json; version=3'
const abortController = new AbortController()

class BeholderService {
  constructor(cancelRequest = null) {
    this.api = axios.create({ baseURL })
    this.cancelRequest = cancelRequest
  }

  async gql(query) {
    try {
      const config = {}

      if (this.cancelRequest) {
        config.signal = abortController.signal
        abortController.abort()
      }

      const reqQuery = JSON.stringify(query)
      const { data } = await this.api.post('', reqQuery, config)

      return data.data
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

export default BeholderService
