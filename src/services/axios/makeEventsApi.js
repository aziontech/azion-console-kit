import axios from 'axios'

const api = () => {
  delete axios.defaults.headers.common['Authorization']
  const baseURL = '/events'

  axios.defaults.headers.common['Accept'] = 'application/json'
  axios.defaults.headers.common['Content-Type'] = 'application/json; version=3'


  return axios.create({
    baseURL
  })
}

export default api
