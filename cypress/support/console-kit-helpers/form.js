/**
 * Form Helpers
 *
 * Console-kit form patterns:
 * - Yup validation with async rules
 * - Conditional field visibility
 * - Lazy-loaded dropdowns
 * - Submit with loading state
 */

export const formHelpers = {
  /**
   * Waits for dropdown options to load (lazy loading).
   *
   * @param {string} dropdownSelector - Selector for the dropdown
   * @param {number} timeout - Max wait time in ms (default 5000)
   */
  waitForDropdownOptions(dropdownSelector, timeout = 5000) {
    cy.get(dropdownSelector).click()
    cy.get('.p-dropdown-items', { timeout }).should('be.visible')
    cy.get('.p-dropdown-item', { timeout }).should('have.length.gt', 0)
  },

  /**
   * Selects an option from a dropdown.
   *
   * @param {string} dropdownSelector - Selector for the dropdown
   * @param {string} optionText - Text of the option to select
   */
  selectDropdownOption(dropdownSelector, optionText) {
    cy.get(dropdownSelector).click()
    cy.get('.p-dropdown-item').contains(optionText).click()
  },

  /**
   * Selects an option from a dropdown by index.
   *
   * @param {string} dropdownSelector - Selector for the dropdown
   * @param {number} index - Zero-based index of the option
   */
  selectDropdownOptionByIndex(dropdownSelector, index) {
    cy.get(dropdownSelector).click()
    cy.get('.p-dropdown-item').eq(index).click()
  },

  /**
   * Types in an input field with clear.
   *
   * @param {string} selector - Input selector
   * @param {string} value - Value to type
   */
  typeInput(selector, value) {
    cy.get(selector).clear().type(value)
  },

  /**
   * Toggles a switch component.
   *
   * @param {string} selector - Switch selector
   * @param {boolean} state - Desired state (true = on, false = off)
   */
  toggleSwitch(selector, state) {
    cy.get(selector).then(($switch) => {
      const isChecked = $switch.hasClass('p-inputswitch-checked')
      if (state !== isChecked) {
        cy.wrap($switch).click()
      }
    })
  },

  /**
   * Fills multiple form fields at once.
   *
   * @param {Object} fieldMap - Object with selector: value pairs
   * @example
   * formHelpers.fillFormFields({
   *   '[data-testid="name-input"]': 'My Name',
   *   '[data-testid="email-input"]': 'test@example.com'
   * })
   */
  fillFormFields(fieldMap) {
    Object.entries(fieldMap).forEach(([selector, value]) => {
      if (typeof value === 'boolean') {
        this.toggleSwitch(selector, value)
      } else if (typeof value === 'object' && value.type === 'dropdown') {
        this.selectDropdownOption(selector, value.value)
      } else {
        this.typeInput(selector, value)
      }
    })
  },

  /**
   * Waits for Yup validation to complete.
   * Validation is debounced in console-kit forms.
   */
  waitForValidation() {
    cy.wait(300) // Validation debounce
  },

  /**
   * Asserts a field has a validation error.
   *
   * @param {string} fieldSelector - Field selector
   * @param {string} errorMessage - Expected error message (optional)
   */
  assertFieldError(fieldSelector, errorMessage = null) {
    cy.get(fieldSelector).parents('.p-field, .field').find('.p-error, .p-invalid').should('exist')

    if (errorMessage) {
      cy.get(fieldSelector)
        .parents('.p-field, .field')
        .find('.p-error, small')
        .should('contain', errorMessage)
    }
  },

  /**
   * Asserts a field has no validation error.
   *
   * @param {string} fieldSelector - Field selector
   */
  assertFieldValid(fieldSelector) {
    cy.get(fieldSelector).should('not.have.class', 'p-invalid')
  },

  /**
   * Clicks the submit button and waits for submission.
   *
   * @param {string} buttonSelector - Submit button selector (default uses common pattern)
   */
  submit(buttonSelector = '[data-testid="form-actions-submit-button"]') {
    cy.get(buttonSelector).click()
  },

  /**
   * Clicks the cancel button.
   *
   * @param {string} buttonSelector - Cancel button selector
   */
  cancel(buttonSelector = '[data-testid="form-actions-cancel-button"]') {
    cy.get(buttonSelector).click()
  },

  /**
   * Asserts a conditional field is visible.
   *
   * @param {string} fieldSelector - Field selector
   */
  assertConditionalFieldVisible(fieldSelector) {
    cy.get(fieldSelector).should('be.visible')
  },

  /**
   * Asserts a conditional field is hidden.
   *
   * @param {string} fieldSelector - Field selector
   */
  assertConditionalFieldHidden(fieldSelector) {
    cy.get(fieldSelector).should('not.exist')
  },

  /**
   * Waits for form to be ready (all lazy fields loaded).
   *
   * @param {number} timeout - Max wait time in ms (default 5000)
   */
  waitForFormReady(timeout = 5000) {
    // Wait for loading indicators to disappear
    cy.get('.p-skeleton', { timeout }).should('not.exist')
    cy.get('.p-progress-spinner', { timeout }).should('not.exist')
  },

  /**
   * Selects multiple items in a MultiSelect component.
   *
   * @param {string} selector - MultiSelect selector
   * @param {string[]} options - Array of option texts to select
   */
  selectMultipleOptions(selector, options) {
    cy.get(selector).click()
    options.forEach((option) => {
      cy.get('.p-multiselect-item').contains(option).click()
    })
    // Close multiselect by clicking outside
    cy.get('body').click(0, 0)
  },

  /**
   * Moves items in a PickList component from source to target.
   *
   * @param {string} picklistSelector - PickList container selector
   * @param {string[]} items - Array of item texts to move
   */
  movePicklistItems(picklistSelector, items) {
    items.forEach((item) => {
      cy.get(picklistSelector)
        .find('.p-picklist-source')
        .contains(item)
        .click()
    })
    cy.get(picklistSelector).find('[data-pc-section="movetotargetbutton"]').click()
  }
}
