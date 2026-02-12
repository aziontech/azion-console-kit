import { rankWith, isNumberControl, or, isIntegerControl } from '@jsonforms/core'
export const InputNumberControlTester = rankWith(2, or(isNumberControl, isIntegerControl))
