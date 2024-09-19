import axios from 'axios'

const makeWebpagetestApi = () => {
  const baseURL = 'https://www.webpagetest.org/'

  delete axios.defaults.withCredentials

  axios.defaults.headers.common['Content-Type'] = 'application/json'

  return axios.create({
    baseURL
  })
}

export default makeWebpagetestApi
