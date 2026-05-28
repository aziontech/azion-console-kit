const { RuleTester } = require('eslint')
const rule = require('../lib/rules/no-unawaited-clipboard')

const ruleTester = new RuleTester({
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  }
})

// Wrap statements that need an async context. Keeps each test focused on the
// shape under inspection without repeating the boilerplate inline.
const asyncWrap = (body) => `async function run() { ${body} }`

ruleTester.run('no-unawaited-clipboard', rule, {
  valid: [
    // Awaited — canonical happy path.
    {
      code: asyncWrap(`await navigator.clipboard.writeText('hello')`)
    },

    // Returned from a function — caller will await it.
    {
      code: `function copy() { return navigator.clipboard.writeText('x') }`
    },

    // Promise chain with .then.
    {
      code: `navigator.clipboard.writeText('x').then(() => null)`
    },

    // Promise chain with .catch.
    {
      code: `navigator.clipboard.writeText('x').catch(() => null)`
    },

    // Promise chain with .finally.
    {
      code: `navigator.clipboard.writeText('x').finally(() => null)`
    },

    // Captured in a variable — caller is expected to consume it elsewhere.
    {
      code: `const p = navigator.clipboard.writeText('x')`
    },

    // Reassignment — same rationale.
    {
      code: `let p; p = navigator.clipboard.writeText('x')`
    },

    // Explicit fire-and-forget via `void`.
    {
      code: `void navigator.clipboard.writeText('x')`
    },

    // Composed via Promise.all.
    {
      code: `Promise.all([navigator.clipboard.writeText('x')])`
    },

    // Composed via Promise.allSettled.
    {
      code: `Promise.allSettled([navigator.clipboard.writeText('x')])`
    },

    // Passed as an argument to a helper that wraps it.
    {
      code: `wrap(navigator.clipboard.writeText('x'))`
    },

    // Unrelated identifier named `clipboard` — must not match.
    {
      code: `someThing.clipboard.writeText('x')`
    },

    // navigator without `.clipboard` — must not match.
    {
      code: `navigator.writeText('x')`
    },

    // readText awaited — happy path.
    {
      code: asyncWrap(`const text = await navigator.clipboard.readText()`)
    },

    // readText captured — caller will consume the promise.
    {
      code: `const p = navigator.clipboard.readText()`
    },

    // Object property — stored for later use.
    {
      code: `const obj = { copy: navigator.clipboard.writeText('x') }`
    }
  ],

  invalid: [
    // Bare fire-and-forget — the original bug.
    {
      code: `navigator.clipboard.writeText('hello')`,
      errors: [{ messageId: 'clipboardWriteTextNotAwaited' }]
    },

    // Inside an async function but still not awaited.
    {
      code: asyncWrap(`navigator.clipboard.writeText('hello')`),
      errors: [{ messageId: 'clipboardWriteTextNotAwaited' }]
    },

    // Through window.navigator — same intent, same bug.
    {
      code: `window.navigator.clipboard.writeText('hello')`,
      errors: [{ messageId: 'clipboardWriteTextNotAwaited' }]
    },

    // readText without await — discards both the value and any rejection.
    {
      code: `navigator.clipboard.readText()`,
      errors: [{ messageId: 'clipboardReadTextNotAwaited' }]
    },

    // Mixed: one good (awaited) call, one bad (bare).
    {
      code: asyncWrap(
        `await navigator.clipboard.writeText('ok'); navigator.clipboard.writeText('bad')`
      ),
      errors: [{ messageId: 'clipboardWriteTextNotAwaited' }]
    }
  ]
})

// eslint-disable-next-line no-console
console.log('no-unawaited-clipboard: all tests passed')
