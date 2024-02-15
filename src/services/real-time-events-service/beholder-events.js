import axios from 'axios'
const baseURL = '/events/graphql'

axios.defaults.headers.common['Content-Type'] = 'application/json; version=3'

export default function BeholderEventsGQL() {
  const controller = new AbortController()

  const api = axios.create({ baseURL })

  return {
    gql: async (query) => {
      try {
        const reqQuery = JSON.stringify(query)

        const { data } = await api.post('', reqQuery, {
          signal: controller.signal
        })

        return data.data
      } catch (error) {
        return Promise.reject(error)
      }
    },
    abortGQL: () => {
      controller.abort()
    }
  }
}
