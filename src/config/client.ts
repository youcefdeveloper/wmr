import axios from 'axios'

const createAxiosInstance = () => {
  const instance = axios.create({
    // Same origin by default: the API is served by this app.
    baseURL: import.meta.env.PUBLIC_API_BASE_URL || '',
    headers: { 'X-API-KEY': import.meta.env.PUBLIC_API_KEY },
  })

  return instance
}

const client = createAxiosInstance()

export { client }
