const { RuleTester } = require('eslint')
const rule = require('../lib/rules/no-internal-state-assert')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('no-internal-state-assert', rule, {
  valid: [
    // Observable behavior: emitted events — allowed
    {
      code: `expect(wrapper.emitted('update:modelValue')).toEqual([[true]])`
    },
    // Observable behavior: DOM text — allowed
    {
      code: `expect(getByTestId('version-state-badge')).toHaveTextContent('Draft')`
    },
    // Observable behavior: attributes/ARIA — allowed
    {
      code: `expect(badge).toHaveAttribute('data-state', 'draft')`
    },
    // Plain value assertion — allowed
    {
      code: `expect(getAvailableActions('draft')).toContain('SAVE')`
    }
  ],
  invalid: [
    // Internal component state — placebo/refactor trap
    {
      code: `expect(wrapper.vm.isFormValid).toBe(true)`,
      errors: [{ messageId: 'noVmAssert' }]
    },
    {
      code: `expect(wrapper.vm.state.value).toEqual('draft')`,
      errors: [{ messageId: 'noVmAssert' }]
    },
    // Class-string list — implementation detail
    {
      code: `expect(wrapper.classes()).toContain('p-disabled')`,
      errors: [{ messageId: 'noClassesAssert' }]
    },
    {
      code: `expect(button.classes().join(' ')).toMatch('bg-primary')`,
      errors: [{ messageId: 'noClassesAssert' }]
    }
  ]
})

// eslint-disable-next-line no-console
console.log('✓ no-internal-state-assert: all RuleTester cases passed')
