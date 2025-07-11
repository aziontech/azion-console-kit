export const hasAnyFieldChanged = (adapter, oldObj, newObj, keysToCheck) => {
  if (!oldObj || !newObj) return false

  const payload = adapter.transformCreateDigitalCertificateLetEncrypt?.(newObj)

  const isDifferent = (previousValue, currentValue) => {
    if (Array.isArray(previousValue) && Array.isArray(currentValue)) {
      if (previousValue.length !== currentValue.length) return true
      return previousValue.some((val, index) => isDifferent(val, currentValue[index]))
    }

    if (
      previousValue &&
      currentValue &&
      typeof previousValue === 'object' &&
      typeof currentValue === 'object'
    ) {
      const allKeys = new Set([...Object.keys(previousValue), ...Object.keys(currentValue)])
      return Array.from(allKeys).some((key) => isDifferent(previousValue[key], currentValue[key]))
    }

    return previousValue !== currentValue
  }

  return keysToCheck.some((key) => isDifferent(oldObj[key], payload?.[key]))
}
