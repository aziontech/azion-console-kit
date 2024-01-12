import axios from 'axios'
const baseURL = '/metrics/graphql'

axios.defaults.headers.common['Content-Type'] = 'application/json; version=3'

const api = axios.create({
  baseURL
})

export default api
