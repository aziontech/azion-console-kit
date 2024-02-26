import axios from 'axios'

const api = (personalToken) => {
  delete axios.defaults.headers.common['Authorization']
  const baseURL = '/api'

  axios.defaults.headers.common['Accept'] = 'application/json; version=3'
  axios.defaults.headers.common['Content-Type'] = 'application/json; version=3'
  axios.defaults.withCredentials = true

  if (personalToken) {
    axios.defaults.headers.common['Authorization'] = `token ${personalToken}`
  }

  return axios.create({
    baseURL
  })
}

export default api
