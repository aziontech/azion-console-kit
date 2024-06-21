export function useScrollToError() {
  const createStringQuerySelector = (errorKeys) => {
    return errorKeys
      .map((key) => {
        return key.startsWith('monaco') ? `[name="${key}"] textarea` : `[name="${key}"]`
      })
      .join(', ')
  }

  const scrollToError = (errors) => {
    const errorKeys = Object.keys(errors)
    const stringQuerySelector = createStringQuerySelector(errorKeys)
    const listElements = document.querySelectorAll(stringQuerySelector)
    if (!listElements.length) return

    const [firstElementError] = listElements

    firstElementError.scrollIntoView({
      block: 'center',
      behavior: 'smooth'
    })
    setTimeout(() => {
      firstElementError.focus({ preventScroll: true })
      firstElementError.click()
    }, 250)
  }
  return {
    scrollToError
  }
}
