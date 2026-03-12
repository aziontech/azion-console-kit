import axios from 'axios'

const makeDocsExternalApi = () => {
  const baseURL = 'https://www.azion.com'

  delete axios.defaults.withCredentials

  axios.defaults.headers.common['Content-Type'] = 'text/markdown'

  return axios.create({
    baseURL,
    baseURL: 'https://www.azion.com/'  // Ensure trailing slash
  })
}

export default makeDocsExternalApi
