import axios from 'axios'
const baseURL = '/api'
const token = import.meta.env.VITE_PERSONAL_TOKEN

axios.defaults.headers.common['Accept'] = 'application/json; version=3'
if (token) {
  axios.defaults.headers.common['Authorization'] = `token ${token}`
}

const api = axios.create({
  baseURL
})

export default api
