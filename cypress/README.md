# E2E Test Development Standards

This document defines the standards and best practices to be followed for developing E2E tests using Cypress in our project.

## Table of Contents

- [E2E Test Development Standards](#e2e-test-development-standards)
  - [Table of Contents](#table-of-contents)
  - [Naming `data-testid`](#naming-data-testid)
  - [Naming Test Files](#naming-test-files)
  - [Using CSS Selectors in Tests](#using-css-selectors-in-tests)
    - [Specific vs. Generic Selectors](#specific-vs-generic-selectors)
    - [Use of Classes and IDs](#use-of-classes-and-ids)
    - [Selector Priority](#selector-priority)
  - [Using `e2mock` to Mock Components](#using-e2mock-to-mock-components)
    - [Use Cases](#use-cases)
    - [Implications](#implications)
  - [Generating Names for Dynamic Entities](#generating-names-for-dynamic-entities)
    - [Example Usage](#example-usage)
  - [Validating Toasts](#validating-toasts)
  - [Validating Values Copied to Clipboard](#validating-values-copied-to-clipboard)

## Naming `data-testid`

To ensure consistency and ease of maintenance for tests, we use the following structure for `data-testid` attributes:

```bash
<location>__<element-name>__<element-type>
```

Examples::
- `list-table-block__column__name__row`
- `header__button__submit`

**Notes:**
- Use hyphens (`-`) to separate words within each part of the identifier.
- Avoid abbreviations that are not widely known.

## Naming Test Files

Test files should follow a consistent naming pattern. Use hyphens (`-`) as word separators.

Example:
- `login-page.spec.js`
- `user-profile.spec.js`

## Using CSS Selectors in Tests

### Specific vs. Generic Selectors

- Prefer specific selectors for tests (`data-testid`) over generic selectors to ensure tests are less susceptible to breaking due to layout changes.

### Use of Classes and IDs

- Use classes and IDs only when necessary. Classes should be used for styling, and IDs for unique elements.

### Selector Priority

1. `data-testid`
2. `IDs` (when the element is unique)
3. `Classes` (when the element has a specific style)
4. `HTML Elements` (only when other selectors are not applicable)

## Using `e2mock` to Mock Components

### Use Cases

Use `e2mock` to mock components and external services during tests, ensuring that tests are consistent and independent of external factors.

### Implications

- Ensure mocks reflect the real expected behavior of the components to avoid false positives in tests.
- **Practical criterion**: Tests should be able to run and pass locally, even without internet access (e.g., Wi-Fi turned off). This ensures that tests are truly independent of external factors and are using mocks correctly.

## Generating Names for Dynamic Entities

To ensure consistency and avoid conflicts, use the `generateUniqueName` function located in the `support/utils.js` folder for generating names for dynamic entities, such as IDs and usernames, in tests.

### Example Usage

The `generateUniqueName` function generates unique names with a formatted timestamp. See the implementation below:

```javascript
import generateUniqueName from '../support/utils';

const userName = generateUniqueName('username');
```

## Validating Toasts

To validate toasts (notifications) in tests:

- Execute the custom command `verifyToast()`.

> Note: the command receives summary and detail as arguments.

Example:

```javascript
cy.verifyToast('Success!', 'User created successfully!');
```

## Validating Values Copied to Clipboard

To validate values that have been copied to the clipboard in tests:

- Execute the custom command `assertValueCopiedToClipboard()`.

> Note: the command takes the expected value that should have been copied to the clipboard as an argument.

Example:
```javascript
cy.assertValueCopiedToClipboard('Expected Value');
```

This command checks whether the current value in the clipboard matches the expected value provided. It removes all extra white spaces and compares the resulting value with the expected value. If the values do not match, the test will fail.