export function useScrollToError() {
  const ELEMENT_DRAWER_SELECTOR = '[data-pc-name="sidebar"]'
  const SCROLL_DELAY_MS = 250

  const createQuerySelectorString = (errorKeys, isInDrawer) => {
    const prefix = isInDrawer ? `${ELEMENT_DRAWER_SELECTOR} ` : ''

    return errorKeys
      .map((key) => {
        const querySelector = key.startsWith('monaco')
          ? `[name="${key}"] textarea`
          : `[name="${key}"]`
        return `${prefix}${querySelector}`
      })
      .join(', ')
  }

  const scrollToErrorElement = (errors, isInDrawer = false) => {
    const errorKeys = Object.keys(errors)
    if (!errorKeys.length) return

    const querySelectorString = createQuerySelectorString(errorKeys, isInDrawer)
    const errorElements = document.querySelectorAll(querySelectorString)
    if (!errorElements.length) return

    const [firstErrorElement] = errorElements
    firstErrorElement.scrollIntoView({ block: 'center', behavior: 'smooth' })

    setTimeout(() => {
      firstErrorElement.focus({ preventScroll: true })
      firstErrorElement.click()
    }, SCROLL_DELAY_MS)
  }

  const scrollToErrorInDrawer = (errors) => scrollToErrorElement(errors, true)

  return {
    scrollToError: scrollToErrorElement,
    scrollToErrorInDrawer
  }
}
