import { rankWith, isNumberControl, isIntegerControl, or } from '@jsonforms/core'

export const inputNumberControlTester = rankWith(2, or(isNumberControl, isIntegerControl))
