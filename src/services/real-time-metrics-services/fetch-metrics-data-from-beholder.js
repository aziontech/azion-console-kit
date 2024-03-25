import axios from 'axios'
const baseURL = '/metrics/graphql'

axios.defaults.headers.common['Content-Type'] = 'application/json; version=3'

function BeholderService({ cancelRequest } = { cancelRequest: false }) {
  const api = axios.create({ baseURL })

  return {
    gql: async (query) => {
      try {
        const config = {}

        if (cancelRequest) {
          config.cancelToken = cancelRequest.token
        }

        const reqQuery = JSON.stringify(query)
        const { data } = await api.post('', reqQuery, config)

        return data.data
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }
}

export default BeholderService
