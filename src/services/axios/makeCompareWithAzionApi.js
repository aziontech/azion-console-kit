import axios from 'axios'

const makeCompareWithAzionApi = () => {
  const baseURL = 'https://www.azion.com/api'

  delete axios.defaults.withCredentials

  axios.defaults.headers.common['Content-Type'] = 'application/json'

  return axios.create({
    baseURL
  })
}

export default makeCompareWithAzionApi
