import axios from 'axios'
const baseURL = 'https://storage.googleapis.com'

axios.defaults.withCredentials = false
delete axios.defaults.headers.common['Authorization']

const api = axios.create({
  baseURL
})

export default api
