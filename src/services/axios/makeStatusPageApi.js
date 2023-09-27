import axios from 'axios'
const baseURL = 'https://status.azion.com/api/v2'

axios.defaults.withCredentials = false
delete axios.defaults.headers.common['Authorization']

const api = axios.create({
  baseURL
})

export default api
