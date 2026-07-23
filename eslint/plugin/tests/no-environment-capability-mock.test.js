const { RuleTester } = require('eslint')
const rule = require('../lib/rules/no-environment-capability-mock')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

ruleTester.run('no-environment-capability-mock', rule, {
  valid: [
    // Restoring a REAL implementation is not a fake (BroadcastChannel case)
    { code: `vi.stubGlobal('BroadcastChannel', NodeBroadcastChannel)` },
    // Clock is a legitimate boundary
    { code: `vi.useFakeTimers()` },
    // Observation-only spy (no behavior replacement)
    { code: `vi.spyOn(element, 'focus')` },
    // Stubbing unrelated globals
    { code: `vi.stubGlobal('EventSource', FakeEventSource)` },
    // location is handled by its own recipe, not this rule
    { code: `Object.defineProperty(window, 'location', { value: {} })` }
  ],
  invalid: [
    {
      code: `vi.stubGlobal('ResizeObserver', class {})`,
      errors: [{ messageId: 'noCapabilityFake' }]
    },
    {
      code: `vi.stubGlobal('matchMedia', () => ({ matches: false }))`,
      errors: [{ messageId: 'noCapabilityFake' }]
    },
    {
      code: `window.matchMedia = vi.fn()`,
      errors: [{ messageId: 'noCapabilityFake' }]
    },
    {
      code: `global.IntersectionObserver = class {}`,
      errors: [{ messageId: 'noCapabilityFake' }]
    },
    {
      code: `Object.defineProperty(window, 'matchMedia', { value: vi.fn() })`,
      errors: [{ messageId: 'noCapabilityFake' }]
    },
    {
      code: `vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({ width: 100 })`,
      errors: [{ messageId: 'noCapabilityFake' }]
    },
    {
      code: `vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(() => {})`,
      errors: [{ messageId: 'noCapabilityFake' }]
    }
  ]
})

console.log('no-environment-capability-mock: all rule tests passed')
