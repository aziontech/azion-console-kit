import axios from 'axios'

const api = (personalToken) => {
  delete axios.defaults.headers.common['Authorization']
  const baseURL = '/events'

  axios.defaults.headers.common['Accept'] = 'application/json'
  //   axios.defaults.headers.common['Accept-Encoding']= 'gzip'
  //   axios.defaults.headers.common['Content-Type'] = 'application/json; version=3'
  console.log(personalToken)

  if (personalToken) {
    axios.defaults.headers.common['Authorization'] = `token ${personalToken}`
  }

  return axios.create({
    baseURL
  })
}

export default api
