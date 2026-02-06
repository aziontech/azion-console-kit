import axios from 'axios'

const appcuesApi = () => {
  const isDev = import.meta.env.DEV

  if (isDev) {
    const apiKey = import.meta.env.VITE_APPCUES_API_KEY
    const secret = import.meta.env.VITE_APPCUES_SECRET

    if (!apiKey || !secret) {
      return null
    }

    const credentials = btoa(`${apiKey}:${secret}`)

    return axios.create({
      baseURL: '/appcues/v2',
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    })
  }

  return axios.create({
    baseURL: 'https://www.azion.com/api/appcues/v2',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  })
}

export default appcuesApi
