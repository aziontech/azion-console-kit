# Reaching 100% of `data-testid` usage in Azion Console Kit for E2E Testing

## Introduction

This document outlines the discovery process regarding the use of `data-testid` attributes for E2E testing with Cypress in Azion Console Kit. The objective was to determine the feasibility of using `data-testid` exclusively for selecting elements during testing. However, we identified limitations due to dependencies and the dynamics of element selection by Cypress.

## Analysis

### PrimeVue

PrimeVue in its current version in the project (3.35.0) imposes constraints on the application of `data-testid` attributes. Although most components support the inheritance of `data-testid` through the `passthrough` (:pt) property, for some elements it is not possible to override attributes directly, unless customized via slots and it may not be optimal. Instead, we are limited to using IDs provided by the library.

#### Example:
Components like `dropdown` generate their own IDs for options, which cannot be overridden with custom attributes like `data-testid`.

### Cypress

The dynamic nature of Cypress might not allow us to have 100% of elements selection using `data-testid`. As presented in the previous section, we are limited by constraints imposed by PrimeVue and nested elements in components is one of them. A component might have a `data-testid` bound to the root, but Cypress might not find it due to nested structure.

#### Example:
Consider PrimeSwitch component:
```vue
<template>
  <PrimeSwitch data-testid="my-component" />
</template>
<script setup>
  import PrimeSwitch from 'primevue/switch'
</script>
```
In the DOM it is converted to something like this:
```html
<div data-testid="my-component">
  <div class="my-class">
    <input role="switch" type="checkbox" />
  </div>
</div>
```
Although the `data-testid` attribute is present and bound to the root component, Cypress might not find it when using Cypress Studio due to the nesting and apply the click event in the input instead of the root element.

## Conclusion

Practical limitations exist in reaching 100% element selection using `data-testid` due to the constraints imposed by PrimeVue and the nested nature of some components.

### Recommendations:
1. Verify PrimeVue documentation to identify components that support `passthrough` attribute and consequently inheritance of `data-testid`.

2. Use the [PrimeVue repository - 3.35.0](https://github.com/primefaces/primevue/tree/3.35.0) with the correct `tag` to double check for differences between official documentation and the current version.

3. For nested elements, that do not support `passthrough`, it is use a combination of `data-testid` and id/aria selectors to select the element.

**Note:** The project currently uses Monaco editor. It is a specific case of the `data-testid` in root + class selector to make Cypress interact with the editor properly. 