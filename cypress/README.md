# Azion Console Kit E2E Tests

This document brings together all the information necessary to configure, run and develop robust and maintainable End-to-End (E2E) tests using Cypress within the Azion Console Kit project. By following best practices, you will learn how to create effective tests that ensure quality of your software.

## Table of Contents

- [E2E Test Environemnt Setup](#e2e-test-environment-setup)
  - [Setting Up the Cypress Environment](#setting-up-the-cypress-environment)
  - [Command Table](#command-table)
- [E2E Test First Steps](#e2e-test-first-steps)
  - [Learn how to create E2E tests with Cypress in 5 easy steps](#learn-how-to-create-e2e-tests-with-cypress-in-5-easy-steps)
- [E2E Test Development Standards](#e2e-test-development-standards)
  - [Using Tags in E2E Tests](#using-tags-in-e2e-tests)
    - [How to use tags in e2e tests](#how-to-use-tags-in-e2e-tests)
    - [Controlling Execution by Tags from the CLI](#controlling-execution-by-tags-from-the-cli)
    - [Tags Used in the Project](#tags-used-in-the-project)
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
  - [Deleting Entities](#deleting-entities)

# E2E Test Environment Setup

This detailed guide provides a step-by-step guide to configuring and integrating Cypress into the Azion Console Kit project, preparing the environment for running End-to-End (E2E) tests.

## Setting Up the Cypress Environment

### Copy and Rename Configuration File

First, copy the cypress.env.example.json file and rename the copied file to `cypress.env.json`. This new file will store your environment secrets.

```bash
cp cypress.env.example.json cypress.env.json
```

### Register Secrets

Open the newly created `cypress.env.json` file and populate it with the appropriate secrets for each environment.

```bash
  "DEV_CYPRESS_EMAIL": "",
  "DEV_CYPRESS_PASSWORD": ""
```

## Command Table

Here is a table of commands for running and opening Cypress tests in various environments:

| Command                     | Mode          | Server        |
|-----------------------------|---------------|---------------|
| `test:e2e:run:dev`          | Headless      | Dev           |
| `test:e2e:run:preview-dev`  | Headless      | Preview       |
| `test:e2e:run:stage`        | Headless      | Stage         |
| `test:e2e:run:prod`         | Headless      | Production    |
| `test:e2e:run:preview-prod` | Headless      | Preview Prod  |
| `test:e2e:open:dev`         | Interactive   | Dev           |
| `test:e2e:open:preview-dev` | Interactive   | Preview       |
| `test:e2e:open:stage`       | Interactive   | Stage         |
| `test:e2e:open:prod`        | Interactive   | Production    |
| `test:e2e:open:preview-prod`| Interactive   | Preview Prod  |

# E2E Test First Steps

This section provides a getting started guide to start learning End-to-End (E2E) tests development with Cypress.

## Learn how to create E2E tests with Cypress in 5 easy steps

In this tutorial, you will learn how to create end-to-end (E2E) tests with Cypress, using the intuitive Cypress Studio. In 5 simple steps, you will write robust tests to guarantee the quality of your web application. Get ready to dominate Cypress!

https://github.com/user-attachments/assets/03a0e525-d383-474d-bb88-ec79d559d0ef

# E2E Test Development Standards

This section covers best practices for developing robust, maintainable E2E tests. You will learn how to structure your tests efficiently, ensuring readability and maintainability, as well as receive tips for writing effective tests that cover the most important scenarios and are easily understandable.

## Using Tags in E2E Tests

### How to use tags in e2e tests

Normal Structure:
```bash
describe('Test', () => {
  // Test cases
});
```

Structure Using Tags:
```bash
describe('Test', { tags: ['@tag1', '@tag2'] }, () => {
  // Test cases
});
```

### Controlling Execution by Tags from the CLI

| Concatenation       | Description                                                             | Command to Run                          |
|---------------------|-------------------------------------------------------------------------|-----------------------------------------|
| @tag1 @tag2         | Runs tests with either @tag1 or @tag2                                   | `--env grepTags='@tag1 @tag2'`          |
| @tag1+@tag2         | Runs tests with both @tag1 and @tag2                                    | `--env grepTags='@tag1+@tag2'`          |
| -@tag1              | Runs tests that do not have the tag @tag1                               | `--env grepTags='-@tag1'`               |
| @tag1+-@tag2        | Runs tests with @tag1 that do not have @tag2                            | `--env grepTags='@tag1+-@tag2'`         |
| --@tag1             | Runs tests that do not have the tag @tag1, even if they have other tags | `--env grepTags='--@tag1'`              |
| @tag1 --@tag2 @tag3 | Runs tests with @tag1 and @tag3 that do not have @tag2                  | `--env grepTags='@tag1 --@tag2 @tag3'`  |

For more details, see the official [@cypress/grep documentation](https://github.com/cypress-io/cypress/tree/develop/npm/grep#cypressgrep)

### Tags Used in the Project

| Tag   | Description                                         |
|-------|-----------------------------------------------------|
| @dev  | Runs the test in the DEV environment                |
| @xfail| Prevents the test from running in workflows         |

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

**Note:** Extra information about selectors interactions with Cypress and PrimeVue is [available here](/docs/E2E_SELECTORS.md).

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

## Deleting Entities

To delete entities in tests:

- Execute the custom command `deleteEntityFromLoadedList()` when already in the list of entities. This command does not require any arguments.

Example:

```javascript
cy.deleteEntityFromLoadedList();
```

- Execute the custom command `deleteEntityFromList()` when not in the list of entities. This command requires the name of the entity, the product name, and the column name where the entity name is displayed in the list. This command uses cy.visit to navigate to the list of entities.

Example:

```javascript
cy.deleteEntityFromList({ entityName: 'Entity Name', productName: 'Product Name', columnName: 'Name' });
```

