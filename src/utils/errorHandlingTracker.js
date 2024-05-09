export const handleTrackerError = (error) => {
  if (!error.includes(':')) {
    return {
      fieldName: '',
      message: error
    }
  }

  const [fieldName, ...restOfStringArr] = error.split(':')
  const message = restOfStringArr.join(':').trim()

  return { fieldName, message }
}
