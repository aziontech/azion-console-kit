import { rankWith, isStringControl, or } from '@jsonforms/core'
export const inputTextControlTester = rankWith(2, or(isStringControl))