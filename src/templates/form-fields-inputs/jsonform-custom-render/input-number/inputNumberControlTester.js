import { rankWith, isNumberControl, isIntegerControl, or } from '@jsonforms/core'

export const textInputControlTester = rankWith(
  2,
  or(
    isNumberControl,
    isIntegerControl
  )
)
