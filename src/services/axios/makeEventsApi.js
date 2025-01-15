import axios from 'axios'

const api = (personalToken) => {
  delete axios.defaults.headers.common['Authorization']
  const version = 'v4'
  const baseURL = `api/${version}/events`

  axios.defaults.headers.common['Accept'] = 'application/json'

  if (personalToken) {
    axios.defaults.headers.common['Authorization'] = `token ${personalToken}`
  }

  return axios.create({
    baseURL
  })
}

export default api
