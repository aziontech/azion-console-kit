import axios from 'axios'

const makeGoogleStorageApi = (baseURL) => {
  axios.defaults.withCredentials = false
  delete axios.defaults.headers.common['Authorization']

  const api = axios.create({
    baseURL
  })

  return api
}

export { makeGoogleStorageApi }
