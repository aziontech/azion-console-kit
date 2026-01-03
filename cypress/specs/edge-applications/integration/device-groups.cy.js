/**
 * Edge Applications - Device Groups Integration Tests
 *
 * API: POST/GET/PUT/DELETE v4/workspace/applications/{id}/device_groups
 * Route: /edge-application/edit/{id}/device-groups
 *
 * Prerequisites: Requires an existing Edge Application
 * Tests: Create, read, update, delete device groups
 *
 * Device Groups: Used to identify user devices based on User-Agent header regex matching
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-application'

const generateName = (prefix = 'DeviceGroup') => {
  // Device Group names must be alphanumeric only (no hyphens or special chars)
  return `${prefix}${Date.now()}`
}

describe('Edge Applications - Device Groups', { tags: ['@integration', '@edge-applications', '@device-groups'] }, () => {
  let applicationName
  let applicationId

  before(() => {
    // Create an Edge Application
    applicationName = generateName('DeviceGroupTestApp')

    cy.login()
    cy.openProduct('Edge Application')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Wait for skeletons to disappear
    cy.get('body').then(($body) => {
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
      }
    })

    // Create application
    cy.get(selectors.mainSettings.createButton, { timeout: 15000 }).click()
    cy.get(selectors.mainSettings.nameInput, { timeout: 15000 })
      .should('be.visible')
      .clear()
      .type(applicationName)

    // Handle v4 form with address field
    cy.get('body').then(($body) => {
      if ($body.find(selectors.mainSettings.addressInput).length) {
        cy.get(selectors.mainSettings.addressInput)
          .clear()
          .type('httpbin.org')
      }
    })

    cy.get(selectors.formActions.saveButton).click()

    // Wait for creation to complete
    cy.url({ timeout: 30000 }).should('not.include', '/create')

    // Navigate to list and then to the application
    cy.openProduct('Edge Application')
    cy.get('.p-datatable', { timeout: 30000 }).should('exist')

    cy.get('body').then(($body) => {
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
      }
    })

    tableHelpers.searchAndSubmit(applicationName)
    cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
      .contains(applicationName)
      .click()

    // Extract the application ID
    cy.url().should('match', /\/(edge-application|applications)\/edit\/\d+/)
    cy.url().then((url) => {
      const match = url.match(/edit\/(\d+)/)
      if (match) {
        applicationId = match[1]
      }
    })
  })

  beforeEach(() => {
    cy.login()
    cy.openProduct('Edge Application')

    // Wait for list to be ready
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    cy.get('body').then(($body) => {
      if ($body.find('.p-skeleton').length) {
        cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
      }
    })

    tableHelpers.searchAndSubmit(applicationName)
    cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 30000 })
      .contains(applicationName)
      .click()

    // Wait for edit page to load
    cy.url().should('match', /\/(edge-application|applications)\/edit\/\d+/)
  })

  // Helper to navigate to Device Groups tab
  const navigateToDeviceGroupsTab = () => {
    cy.get(selectors.tabs('Device Groups'), { timeout: 15000 }).click()
    cy.url().should('match', /device-groups|deviceGroups/)
  }

  // Helper to get create button
  const getCreateButton = () => {
    return cy.get(selectors.deviceGroups.createButton, { timeout: 15000 })
  }

  describe('Device Groups Tab Navigation', () => {
    it('should navigate to Device Groups tab', () => {
      navigateToDeviceGroupsTab()
      cy.url().should('match', /device-groups|deviceGroups/)
    })

    it('should have create device group button', () => {
      navigateToDeviceGroupsTab()
      getCreateButton().should('be.visible')
    })
  })

  describe('Create Device Group', () => {
    it('should open create device group drawer', () => {
      navigateToDeviceGroupsTab()
      getCreateButton().click()

      // Drawer should open
      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('be.visible')

      // Name input should be visible
      cy.get('[data-testid*="name"][data-testid*="input"], [name="name"]', { timeout: 10000 })
        .first()
        .should('be.visible')
    })

    it('should create a device group for mobile devices', () => {
      const groupName = generateName('MobileDevices')
      const mobileRegex = '(Mobile|Android|iPhone|iPad)'

      cy.intercept('POST', '**/device_groups').as('createDeviceGroup')

      navigateToDeviceGroupsTab()
      getCreateButton().click()

      // Wait for drawer
      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get('[data-testid*="name"][data-testid*="input"], [name="name"]', { timeout: 10000 })
        .first()
        .clear()
        .type(groupName)

      // Fill User-Agent regex
      cy.get('textarea[name="userAgent"], [data-testid*="user"][data-testid*="textarea"]', { timeout: 10000 })
        .first()
        .clear()
        .type(mobileRegex, { parseSpecialCharSequences: false })

      // Save
      cy.get(selectors.formActions.saveButton).click()

      // Wait for API call
      cy.wait('@createDeviceGroup', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      // Verify drawer closes
      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('not.exist')

      // Verify device group appears in list
      cy.contains(groupName, { timeout: 15000 }).should('exist')
    })

    it('should show validation error for missing required fields', () => {
      navigateToDeviceGroupsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('be.visible')

      // Try to submit without filling required fields
      cy.get(selectors.formActions.saveButton).click()

      // Should show validation error
      cy.get('.p-toast-message-error, [class*="error"], .p-invalid', { timeout: 10000 }).should('exist')
    })

    it('should create device group for desktop browsers', () => {
      const groupName = generateName('DesktopBrowsers')
      const desktopRegex = '(Windows NT|Macintosh|Linux x86)'

      cy.intercept('POST', '**/device_groups').as('createDeviceGroup')

      navigateToDeviceGroupsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('be.visible')

      cy.get('[data-testid*="name"][data-testid*="input"], [name="name"]', { timeout: 10000 })
        .first()
        .clear()
        .type(groupName)

      cy.get('textarea[name="userAgent"], [data-testid*="user"][data-testid*="textarea"]', { timeout: 10000 })
        .first()
        .clear()
        .type(desktopRegex, { parseSpecialCharSequences: false })

      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@createDeviceGroup', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      cy.contains(groupName, { timeout: 15000 }).should('exist')
    })
  })

  describe('Edit Device Group', () => {
    it('should open edit drawer when clicking on a device group', () => {
      const groupName = generateName('EditTest')
      const regex = '(TestAgent)'

      cy.intercept('POST', '**/device_groups').as('createDeviceGroup')

      // Create a device group first
      navigateToDeviceGroupsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('be.visible')

      cy.get('[data-testid*="name"][data-testid*="input"], [name="name"]', { timeout: 10000 })
        .first()
        .clear()
        .type(groupName)

      cy.get('textarea[name="userAgent"], [data-testid*="user"][data-testid*="textarea"]', { timeout: 10000 })
        .first()
        .clear()
        .type(regex, { parseSpecialCharSequences: false })

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createDeviceGroup', { timeout: 30000 })

      // Wait for drawer to close
      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Click on the device group to edit
      cy.contains(groupName, { timeout: 15000 }).click()

      // Edit drawer should open
      cy.contains('h2', /Edit Device Group/i, { timeout: 15000 }).should('be.visible')

      // Name should be pre-filled
      cy.get('[data-testid*="name"][data-testid*="input"], [name="name"]')
        .first()
        .should('have.value', groupName)
    })

    it('should update device group regex', () => {
      const groupName = generateName('UpdateTest')
      const originalRegex = '(Original)'
      const updatedRegex = '(Updated|Modified)'

      cy.intercept('POST', '**/device_groups').as('createDeviceGroup')
      cy.intercept('PUT', '**/device_groups/**').as('updateDeviceGroup')

      // Create device group
      navigateToDeviceGroupsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('be.visible')

      cy.get('[data-testid*="name"][data-testid*="input"], [name="name"]', { timeout: 10000 })
        .first()
        .clear()
        .type(groupName)

      cy.get('textarea[name="userAgent"], [data-testid*="user"][data-testid*="textarea"]', { timeout: 10000 })
        .first()
        .clear()
        .type(originalRegex, { parseSpecialCharSequences: false })

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createDeviceGroup', { timeout: 30000 })

      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Edit
      cy.contains(groupName, { timeout: 15000 }).click()

      cy.contains('h2', /Edit Device Group/i, { timeout: 15000 }).should('be.visible')

      // Update regex
      cy.get('textarea[name="userAgent"], [data-testid*="user"][data-testid*="textarea"]')
        .first()
        .clear()
        .type(updatedRegex, { parseSpecialCharSequences: false })

      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@updateDeviceGroup', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 202])

      // Verify success toast
      cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')
    })
  })

  describe('Delete Device Group', () => {
    it('should delete a device group', () => {
      const groupName = generateName('ToDelete')

      cy.intercept('POST', '**/device_groups').as('createDeviceGroup')
      cy.intercept('DELETE', '**/device_groups/**').as('deleteDeviceGroup')

      // Create device group to delete
      navigateToDeviceGroupsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('be.visible')

      cy.get('[data-testid*="name"][data-testid*="input"], [name="name"]', { timeout: 10000 })
        .first()
        .clear()
        .type(groupName)

      cy.get('textarea[name="userAgent"], [data-testid*="user"][data-testid*="textarea"]', { timeout: 10000 })
        .first()
        .clear()
        .type('(ToDelete)', { parseSpecialCharSequences: false })

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createDeviceGroup', { timeout: 30000 })

      // Wait for drawer to close
      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Find and delete
      cy.contains(groupName, { timeout: 30000 })
        .parents('tr')
        .find('[data-testid="data-table-actions-column-body-action-button"], .pi-trash')
        .first()
        .click()

      // Confirm deletion
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .clear()
        .type(groupName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Wait for delete API call
      cy.wait('@deleteDeviceGroup', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 202, 204])

      // Verify success
      cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 10000 }).should('exist')
    })
  })

  describe('Search Device Groups', () => {
    it('should filter device groups by search term', () => {
      const groupName = generateName('SearchTest')

      cy.intercept('POST', '**/device_groups').as('createDeviceGroup')

      // Create a device group
      navigateToDeviceGroupsTab()
      getCreateButton().click()

      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('be.visible')

      cy.get('[data-testid*="name"][data-testid*="input"], [name="name"]', { timeout: 10000 })
        .first()
        .clear()
        .type(groupName)

      cy.get('textarea[name="userAgent"], [data-testid*="user"][data-testid*="textarea"]', { timeout: 10000 })
        .first()
        .clear()
        .type('(SearchTest)', { parseSpecialCharSequences: false })

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createDeviceGroup', { timeout: 30000 })

      cy.contains('h2', /Create Device Group/i, { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Search for the device group
      cy.get(selectors.searchInput, { timeout: 10000 })
        .clear()
        .type(groupName)
        .type('{enter}')

      // Verify search results
      cy.get('.p-datatable-tbody tr', { timeout: 15000 })
        .should('contain', groupName)
    })
  })

  after(() => {
    // Cleanup: Delete the test application
    if (applicationName) {
      cy.login()
      cy.openProduct('Edge Application')
      cy.get('.p-datatable', { timeout: 30000 }).should('exist')

      cy.get('body').then(($body) => {
        if ($body.find('.p-skeleton').length) {
          cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')
        }
      })

      tableHelpers.searchAndSubmit(applicationName)

      cy.get('body').then(($body) => {
        if ($body.find('[data-testid*="list-table-block__column__name"]').text().includes(applicationName)) {
          cy.get('[data-testid*="list-table-block__column__name"]')
            .contains(applicationName)
            .parents('tr')
            .find(selectors.actions.menuButton)
            .click()

          cy.contains('Delete').click()

          cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
            .clear()
            .type(applicationName)

          cy.get(selectors.deleteDialog.deleteButton).click()
        }
      })
    }
  })
})
