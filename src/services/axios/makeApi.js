import axios from 'axios'
const baseURL = 'https://cors-stage-api.azion.net'
const token = import.meta.env.VITE_PERSONAL_TOKEN

if(token){
  axios.defaults.headers.common['Authorization'] = `token ${token}`
  axios.defaults.headers.common['Accept'] = 'application/json; version=3'
}

const api = axios.create({
  baseURL
})

export default api