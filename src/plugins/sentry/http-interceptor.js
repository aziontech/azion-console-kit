/**
 * HTTP system interceptor for the project
 * @module sentry/http-interceptor
 */

import { captureException, setTags, setContext } from './methods.js'
import { getEnvironmentConfig } from './config.js'

/**
 * Configures interceptors for the project's HttpService
 * @param {Object} httpService - HttpService instance
 * @param {string} environment - Application environment
 */
export function setupHttpInterceptors(httpService, environment) {
  const config = getEnvironmentConfig(environment)

  // Only configure interceptors if network monitoring is enabled
  if (!config.enableNetworkMonitoring) {
    return
  }

  // Intercept HttpService.request method
  const originalRequest = httpService.request.bind(httpService)

  httpService.request = async function (options) {
    const startTime = performance.now()
    const requestId = Math.random().toString(36).substring(7)

    // Add request context
    setContext('http_request', {
      id: requestId,
      method: options.method,
      url: options.url,
      params: options.params,
      body: options.body,
      abortIdentifier: options.abortIdentifier,
      abortGroup: options.abortGroup,
      timestamp: new Date().toISOString()
    })

    // Set request tags
    setTags({
      http_request: true,
      http_method: options.method,
      http_url: options.url,
      request_id: requestId
    })

    try {
      const response = await originalRequest(options)

      const endTime = performance.now()
      const duration = endTime - startTime

      // Add response context
      setContext('http_response', {
        id: requestId,
        status: response?.status,
        statusText: response?.statusText,
        duration: Math.round(duration),
        timestamp: new Date().toISOString()
      })

      // Monitor slow responses
      if (duration > 5000) {
        // More than 5 seconds
        captureException(new Error('HTTP response too slow'), {
          component: 'HttpInterceptor',
          action: 'slow_response',
          data: {
            requestId,
            url: options.url,
            method: options.method,
            responseTime: Math.round(duration),
            status: response?.status
          }
        })
      }

      // Monitor 4xx and 5xx responses
      if (response?.status >= 400) {
        captureException(new Error(`HTTP Error ${response.status}`), {
          component: 'HttpInterceptor',
          action: 'http_error_response',
          data: {
            requestId,
            url: options.url,
            method: options.method,
            status: response.status,
            statusText: response.statusText,
            duration: Math.round(duration)
          }
        })
      }

      return response
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Categorize different error types
      let errorType = 'unknown'
      let errorMessage = error.message

      if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        errorType = 'abort'
        errorMessage = 'Request aborted'
      } else if (error.code === 'NETWORK_ERROR') {
        errorType = 'network'
        errorMessage = 'Network error'
      } else if (error.response) {
        errorType = 'http'
        errorMessage = `HTTP Error ${error.response.status}`
      } else if (error.request) {
        errorType = 'request'
        errorMessage = 'Request failed'
      }

      // Add specific error context
      setContext('http_error', {
        id: requestId,
        type: errorType,
        message: errorMessage,
        url: options.url,
        method: options.method,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestData: options.body,
        duration: Math.round(duration),
        abortIdentifier: options.abortIdentifier,
        abortGroup: options.abortGroup
      })

      // Specific tags for Sentry filters
      setTags({
        http_error: true,
        http_error_type: errorType,
        http_status: error.response?.status || 'unknown',
        request_id: requestId
      })

      captureException(error, {
        component: 'HttpInterceptor',
        action: 'http_error',
        data: {
          requestId,
          url: options.url,
          method: options.method,
          errorType,
          duration: Math.round(duration),
          abortIdentifier: options.abortIdentifier,
          abortGroup: options.abortGroup
        }
      })

      throw error
    }
  }
}

/**
 * Configures interceptors for HttpClient
 * @param {Object} httpClient - HttpClient instance
 * @param {string} environment - Application environment
 */
export function setupHttpClientInterceptors(httpClient, environment) {
  const config = getEnvironmentConfig(environment)

  // Only configure interceptors if network monitoring is enabled
  if (!config.enableNetworkMonitoring) {
    return
  }

  // Intercept HttpClient.send method
  const originalSend = httpClient.send.bind(httpClient)

  httpClient.send = async function (config) {
    const startTime = performance.now()
    const requestId = Math.random().toString(36).substring(7)

    // Add request context
    setContext('http_client_request', {
      id: requestId,
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      hasToken: !!this.token,
      timestamp: new Date().toISOString()
    })

    // Set request tags
    setTags({
      http_client_request: true,
      http_method: config.method,
      http_url: config.url,
      request_id: requestId
    })

    try {
      const response = await originalSend(config)

      const endTime = performance.now()
      const duration = endTime - startTime

      // Add response context
      setContext('http_client_response', {
        id: requestId,
        status: response?.status,
        statusText: response?.statusText,
        duration: Math.round(duration),
        timestamp: new Date().toISOString()
      })

      // Monitor slow responses
      if (duration > 5000) {
        // More than 5 seconds
        captureException(new Error('HTTP client response too slow'), {
          component: 'HttpClientInterceptor',
          action: 'slow_response',
          data: {
            requestId,
            url: config.url,
            method: config.method,
            responseTime: Math.round(duration),
            status: response?.status
          }
        })
      }

      return response
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime

      // Add error context
      setContext('http_client_error', {
        id: requestId,
        type: error.name || 'unknown',
        message: error.message,
        url: config.url,
        method: config.method,
        status: error.response?.status,
        duration: Math.round(duration),
        hasToken: !!this.token
      })

      captureException(error, {
        component: 'HttpClientInterceptor',
        action: 'http_error',
        data: {
          requestId,
          url: config.url,
          method: config.method,
          duration: Math.round(duration)
        }
      })

      throw error
    }
  }
}

/**
 * Configures interceptors for AbortManager
 * @param {Object} abortManager - AbortManager instance
 * @param {string} environment - Application environment
 */
export function setupAbortManagerInterceptors(abortManager, environment) {
  const config = getEnvironmentConfig(environment)

  // Only configure interceptors if network monitoring is enabled
  if (!config.enableNetworkMonitoring) {
    return
  }

  // Intercept AbortManager.abort method
  const originalAbort = abortManager.abort.bind(abortManager)

  abortManager.abort = function (identifier) {
    // Add abort context
    setContext('http_abort', {
      identifier,
      timestamp: new Date().toISOString(),
      reason: 'manual_abort'
    })

    setTags({
      http_abort: true,
      abort_identifier: identifier
    })

    captureException(new Error('Request aborted'), {
      component: 'AbortManagerInterceptor',
      action: 'request_aborted',
      data: {
        identifier,
        reason: 'manual_abort'
      }
    })

    return originalAbort(identifier)
  }

  // Intercept AbortManager.abortGroup method
  const originalAbortGroup = abortManager.abortGroup.bind(abortManager)

  abortManager.abortGroup = function (groupName) {
    // Add abort group context
    setContext('http_abort_group', {
      groupName,
      timestamp: new Date().toISOString(),
      reason: 'group_abort'
    })

    setTags({
      http_abort_group: true,
      abort_group: groupName
    })

    captureException(new Error('Request group aborted'), {
      component: 'AbortManagerInterceptor',
      action: 'group_aborted',
      data: {
        groupName,
        reason: 'group_abort'
      }
    })

    return originalAbortGroup(groupName)
  }
}
