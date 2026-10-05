const API_BASE_URL =
  'http://127.0.0.1:8000/api'
const AUTH_EXPIRED_EVENT =
  'servicehub:auth-expired'

let refreshRequest = null

const getToken = () => {
  return localStorage.getItem(
    'access_token'
  )
}

const readResponse = async (response) => {
  const responseText = await response.text()

  if (!responseText) {
    return null
  }

  try {
    return JSON.parse(responseText)
  } catch {
    return responseText
  }
}

const clearStoredAuth = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user')
  window.dispatchEvent(
    new Event(AUTH_EXPIRED_EVENT)
  )
}

const refreshAccessToken = async () => {
  if (!refreshRequest) {
    refreshRequest = (async () => {
      const refreshToken =
        localStorage.getItem('refresh_token')

      if (!refreshToken) {
        throw new Error('Refresh token is missing.')
      }

      const response = await fetch(
        `${API_BASE_URL}/token/refresh/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh: refreshToken,
          }),
        }
      )
      const data = await readResponse(response)

      if (!response.ok || !data?.access) {
        throw new Error(
          data?.detail ||
            'Your session has expired.'
        )
      }

      localStorage.setItem(
        'access_token',
        data.access
      )

      if (data.refresh) {
        localStorage.setItem(
          'refresh_token',
          data.refresh
        )
      }

      return data.access
    })()
  }

  try {
    return await refreshRequest
  } finally {
    refreshRequest = null
  }
}

const buildHeaders = (options, token) => {
  const isFormData =
    options.body instanceof FormData

  const headers = {
    ...(options.headers || {}),
  }

  if (isFormData) {
    delete headers['Content-Type']
    delete headers['content-type']
  } else {
    headers['Content-Type'] =
      'application/json'
  }

  if (token) {
    headers.Authorization =
      `Bearer ${token}`
  } else {
    delete headers.Authorization
    delete headers.authorization
  }

  return headers
}

const sendRequest = (endpoint, options, token) => {
  return fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: buildHeaders(options, token),
    }
  )
}

const apiRequest = async (
  endpoint,
  options = {}
) => {
  let token = getToken()
  let response = await sendRequest(
    endpoint,
    options,
    token
  )
  let data = await readResponse(response)

  if (response.status === 401 && token) {
    try {
      token = await refreshAccessToken()
    } catch {
      clearStoredAuth()
      throw new Error(
        'Your session expired. Please log in again.'
      )
    }

    response = await sendRequest(
      endpoint,
      options,
      token
    )
    data = await readResponse(response)

    if (response.status === 401) {
      clearStoredAuth()
      throw new Error(
        'Your session expired. Please log in again.'
      )
    }
  }

  if (!response.ok) {
    let errorMessage =
      'Something went wrong.'

    if (typeof data === 'string') {
      errorMessage = data
    } else if (data) {
      errorMessage =
        data.detail ||
        data.message ||
        data.error ||
        Object.values(data)
          .flat()
          .join(' ') ||
        errorMessage
    }

    throw new Error(errorMessage)
  }

  return data
}

export const getServices = () => {
  return apiRequest('/services/')
}

export const getBookings = () => {
  return apiRequest('/bookings/')
}

export const getServiceProviders = () => {
  return apiRequest(
    '/service-providers/'
  )
}

export const sendAssistantMessage = (message, history, sessionId) => {
  return apiRequest('/chatbot/', {
    method: 'POST',
    body: JSON.stringify({
      message,
      history,
      session_id: sessionId,
    }),
  })
}

export default apiRequest