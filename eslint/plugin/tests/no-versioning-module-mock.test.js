const { RuleTester } = require('eslint')
const rule = require('../lib/rules/no-versioning-module-mock')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('no-versioning-module-mock', rule, {
  valid: [
    // Mocking an external boundary (HTTP client) — allowed
    {
      code: `vi.mock('@/services/axios/AxiosHttpClientAdapter')`
    },
    // Mocking the router boundary — allowed
    {
      code: `vi.mock('vue-router')`
    },
    // Mocking the toast boundary — allowed
    {
      code: `vi.mock('@aziontech/webkit/use-toast')`
    },
    // Non-literal argument — out of scope for this rule
    {
      code: `vi.mock(modulePath)`
    },
    // Unrelated vi API — allowed
    {
      code: `vi.spyOn(console, 'warn')`
    }
  ],
  invalid: [
    {
      code: `vi.mock('@/composables/versioning/version-machine')`,
      errors: [{ messageId: 'noMockUnderTest' }]
    },
    {
      code: `vi.mock('@/composables/versioning/use-version-form-adapter')`,
      errors: [{ messageId: 'noMockUnderTest' }]
    },
    {
      code: `vi.mock('@/templates/version-shell-block/use-version-shell')`,
      errors: [{ messageId: 'noMockUnderTest' }]
    },
    {
      code: `vi.mock('@/services/v2/edge-app/edge-app-version-adapter')`,
      errors: [{ messageId: 'noMockUnderTest' }]
    },
    {
      code: `vi.doMock('@/services/v2/versioning/version-service-base')`,
      errors: [{ messageId: 'noMockUnderTest' }]
    }
  ]
})

// eslint-disable-next-line no-console
console.log('✓ no-versioning-module-mock: all RuleTester cases passed')
