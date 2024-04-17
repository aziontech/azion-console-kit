import axios from 'axios'

const api = () => {
  delete axios.defaults.headers.common['Authorization']
  delete axios.defaults.withCredentials

  const baseURL = 'https://api.github.com/'

  axios.defaults.headers.common['Accept'] = 'application/json; version=3'
  axios.defaults.headers.common['Content-Type'] = 'application/json'

  return axios.create({
    baseURL
  })
}

export default api