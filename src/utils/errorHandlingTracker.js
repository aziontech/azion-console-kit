export const handleTrackerError = (error) => {
  if (!error.includes(':')) {
    return {
      fieldName: '',
      message: error
    }
  }

  const [fieldName, ...restOfStringArr] = error.split(':')

  return { fieldName, message }
}
