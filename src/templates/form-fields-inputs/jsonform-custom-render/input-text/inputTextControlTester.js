import { rankWith, isStringControl, or } from '@jsonforms/core'
export const InputTextControlTester = rankWith(2, or(isStringControl))
