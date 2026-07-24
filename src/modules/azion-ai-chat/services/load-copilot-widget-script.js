const CUSTOM_ELEMENT_NAME = 'azion-chat-widget'

let loadPromise = null

export const loadCopilotWidgetScript = (scriptUrl) => {
  if (customElements.get(CUSTOM_ELEMENT_NAME)) {
    return Promise.resolve()
  }

  if (!loadPromise) {
    // The widget bundle references process.env.NODE_ENV without it being
    // inlined at build time, so the browser needs this global to exist.
    window.process ??= { env: { NODE_ENV: 'production' } }

    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = scriptUrl
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  return loadPromise
}
