export function useScrollToError() {
  const scrollToError = (formRef, errors) => {
    if (!formRef.value) return

    const errorKeys = Object.keys(errors)
    const stringQuerySelector = errorKeys
      .map((key) => {
        return key.startsWith('monaco') ? `[name="${key}"] textarea` : `[name="${key}"]`
      })
      .join(', ')

    const listElements = formRef.value.querySelectorAll(stringQuerySelector)
    if (!listElements.length) return

    const firstElError = listElements[0]
    const elementPosition = firstElError.getBoundingClientRect().top + window.scrollY
    formRef.value.scrollTo({ top: elementPosition, behavior: 'smooth' })
    firstElError.focus({ preventScroll: true })
    firstElError.click()
  }

  return {
    scrollToError
  }
}
