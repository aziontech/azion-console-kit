import axios from 'axios'
const baseURL = '/events/graphql'

axios.defaults.headers.common['Content-Type'] = 'application/json; version=3'

const api = axios.create({
  baseURL
})

export default api
