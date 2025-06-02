export class ErrorHandler {
  static ERROR_MESSAGES = {
    CONNECTION_ERROR: 'Unable to connect to the server. Please check your internet connection.',
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.'
  }

  constructor(status, messages) {
    this.status = status
    this.message = Array.isArray(messages) ? messages : [messages]
  }

  static create(error) {
    const status = error?.response?.status || 500
    const messages = this._extractMessages(error)
    return new ErrorHandler(status, messages)
  }

  static _extractMessages(error) {
    if (!error?.response) {
      return [this.ERROR_MESSAGES.CONNECTION_ERROR]
    }

    const { data } = error.response

    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.map((err) => {
        const fieldName = this._formatPath(err.source?.pointer)
        return fieldName ? `${fieldName}: ${err.detail}` : err.detail
      })
    }

    return [error.message || this.ERROR_MESSAGES.UNEXPECTED_ERROR]
  }

  static _formatPath(path) {
    const prefix = '/data/'
    if (!path?.startsWith(prefix)) return null

    const rest = path.slice(prefix.length)
    if (!rest) return null

    return rest
      .split('/')
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(' - ')
  }

  showErrors(toast) {
    this._addToast(toast, this._getDefaultOptions())
  }

  showWithOptions(toast, options) {
    if (typeof options === 'function') {
      this._showWithCallback(toast, options)
    } else {
      this._addToast(toast, { ...this._getDefaultOptions(), ...options })
    }
  }

  showWithCallback(callback) {
    this.message.forEach((message) => {
      callback({ ...this, message })
    })
  }

  _getDefaultOptions() {
    return {
      summary: 'Error',
      severity: 'error',
      closable: true
    }
  }

  _addToast(toast, options) {
    this.message.forEach((message) => {
      toast.add({
        detail: message,
        ...options
      })
    })
  }

  _showWithCallback(toast, optionsCallback) {
    this.message.forEach((message) => {
      const errorContext = { ...this, message }
      const customOptions = optionsCallback(errorContext)
      const options = { ...this._getDefaultOptions(), ...customOptions }

      toast.add({
        detail: message,
        ...options
      })
    })
  }
}
