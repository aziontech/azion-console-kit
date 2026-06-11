import axios from 'axios'

const baseURL = 'https://api.azion.com/v4'

delete axios.defaults.headers.common['Authorization']
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.headers.common['Content-Type'] = 'application/json'

const api = axios.create({
  baseURL
})

export default api
