import { rankWith, isStringControl, or } from '@jsonforms/core'

export const textInputControlTester = rankWith(
  2,
  or(
    isStringControl
  )
)
