import * as Errors from '@/services/axios/errors'

export const handleTrackerError = (error) => {
  const errorVariableIsAString = typeof error === 'string'

  if (!errorVariableIsAString) {
    return {
      fieldName: 'no field',
      message: new Errors.UnexpectedError().message
    }
  }

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
