export class ErrorHandler {
  static ERROR_MESSAGES = {
    CONNECTION_ERROR: 'Unable to connect to the server. Please check your internet connection.',
    UNEXPECTED_ERROR: 'An unexpected error occurred. Please try again.'
  }

  constructor(status, messages, code) {
    this.status = status
    this.message = Array.isArray(messages) ? messages : [messages]
    this.code = code
  }

  static create(error) {
    const status = error?.response?.status || 500
    const code = error?.code || null
    const messages = this._extractMessages(error)
    return new ErrorHandler(status, messages, code)
  }

  static createMeta(axiosError) {
    const respData = axiosError.response?.data
    const firstErr = respData?.errors?.[0]

    if (firstErr?.meta) {
      return {
        data: {
          meta: firstErr.meta,
          hasError: true,
          error: () => this.create(axiosError)
        },
        status: axiosError.response.status
      }
    }

    return null
  }

  static _extractMessages(error) {
    if (!error?.response) {
      return [this.ERROR_MESSAGES.CONNECTION_ERROR]
    }

    const { data } = error.response

    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.map((err) => this._composeMessage(err))
    }

    return [error.message || this.ERROR_MESSAGES.UNEXPECTED_ERROR]
  }

  static _composeMessage(err) {
    const offendingRefs = Array.isArray(err?.meta?.offending_refs) ? err.meta.offending_refs : []
    let detail = err?.detail ?? ''
    if (detail.includes('{field}')) {
      detail = detail.split('{field}').join(this._offendingField(err, offendingRefs))
    }
    const context = this._offendingContext(offendingRefs)
    const message = context ? `${detail} ${context}` : detail
    const fieldName = this._formatPath(err?.source?.pointer)
    return fieldName ? `${fieldName}: ${message}` : message
  }

  static _offendingField(err, offendingRefs) {
    const types = [
      ...new Set(offendingRefs.map((ref) => this._humanizeType(ref?.resource_type)).filter(Boolean))
    ]
    if (types.length) return types.join(', ')
    return this._pointerLeaf(err?.source?.pointer) ?? 'field'
  }

  static _offendingContext(offendingRefs) {
    const parts = offendingRefs
      .map((ref) => {
        const expected = this._refValue(ref?.expected)
        const got = this._refValue(ref?.got)
        if (expected && got) return `expected ${expected}, got ${got}`
        if (expected) return `expected ${expected}`
        if (got) return `got ${got}`
        return null
      })
      .filter(Boolean)
    return parts.length ? `(${parts.join('; ')})` : ''
  }

  static _refValue(value) {
    if (value === null || value === undefined) return null
    const text = String(value).trim()
    return text === '' ? null : text
  }

  static _humanizeType(type) {
    if (!type) return null
    return String(type)
      .split('_')
      .map((part) => (part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : part))
      .join(' ')
  }

  static _pointerLeaf(pointer) {
    if (typeof pointer !== 'string' || !pointer) return null
    const segments = pointer.split('/').filter(Boolean)
    return segments.length ? segments[segments.length - 1] : null
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
