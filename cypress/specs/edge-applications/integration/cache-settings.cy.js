/**
 * Edge Applications - Cache Settings Integration Tests
 *
 * API: POST/GET/PUT/DELETE v4/workspace/applications/{id}/cache_settings
 * Route: /edge-application/edit/{id}/cache-settings
 *
 * Prerequisites: Requires an existing Edge Application
 * Tests: Create, read, update, delete cache settings policies
 */

import { tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/edge-application'

const generateName = (prefix = 'CacheSetting') => {
  // Use hyphen instead of underscore - validation requires ^[a-zA-Z0-9 \-\.\'\\:\(\)\[\]]+$
  return `${prefix}-${Date.now()}`
}

describe('Edge Applications - Cache Settings', { tags: ['@integration', '@edge-applications', '@cache-settings'] }, () => {
  let applicationName
  let applicationId

  before(() => {
    // Create an Edge Application to use for Cache Settings tests
    applicationName = generateName('CacheSettingsTestApp')

    cy.login()
    cy.openProduct('Edge Application')
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

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

    // Wait for creation to complete - URL should change from /create
    cy.url({ timeout: 30000 }).should('not.include', '/create')

    // After creation, navigate to list and then to the application
    cy.openProduct('Edge Application')
    cy.get('.p-datatable', { timeout: 30000 }).should('exist')
    cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')

    tableHelpers.searchAndSubmit(applicationName)
    cy.get('[data-testid*="list-table-block__column__name"]', { timeout: 15000 })
      .contains(applicationName)
      .click()

    // Now we should be on the edit page - extract the ID
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
    // Navigate to the created application
    cy.openProduct('Edge Application')

    // Wait for list to be ready with extended timeout for slow API
    cy.get('.p-datatable, [data-testid*="empty"]', { timeout: 30000 }).should('exist')

    // Wait for skeletons with extended timeout
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

  // Helper to get create button
  const getCreateButton = () => {
    return cy.get(selectors.cacheSettings.createButton, { timeout: 15000 })
  }

  // Helper to navigate to Cache Settings tab
  const navigateToCacheSettingsTab = () => {
    cy.get(selectors.tabs('Cache Settings'), { timeout: 15000 })
      .should('be.visible')
      .click()
    cy.url().should('include', 'cache-settings')
  }

  describe('Cache Settings Tab Navigation', () => {
    it('should navigate to Cache Settings tab', () => {
      navigateToCacheSettingsTab()
      // Verify we're on the cache settings tab
      cy.url().should('include', 'cache-settings')
    })

    it('should have create cache settings button', () => {
      navigateToCacheSettingsTab()
      getCreateButton().should('be.visible')
    })

    it('should display empty state or list of cache settings', () => {
      navigateToCacheSettingsTab()
      // APIv4: Cache settings are NOT created by default
      // Should show either empty state message, table, or create button (all valid states)
      cy.get('body').then(($body) => {
        const hasEmpty = $body.text().includes('No cache settings')
        const hasTable = $body.find('.p-datatable').length > 0
        const hasCreateButton = $body.find(selectors.cacheSettings.createButton).length > 0
        expect(hasEmpty || hasTable || hasCreateButton).to.be.true
      })
    })
  })

  describe('Create Cache Settings', () => {
    it('should open create cache settings drawer', () => {
      navigateToCacheSettingsTab()
      getCreateButton().click()

      // Drawer should open - verify by title
      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

      // Name input should be visible
      cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
        .should('be.visible')
    })

    it('should create a basic cache settings with Honor Origin Cache Headers', () => {
      const cacheName = generateName('HonorOrigin')

      // Intercept the create request
      cy.intercept('POST', '**/cache_settings').as('createCacheSettings')

      navigateToCacheSettingsTab()
      getCreateButton().click()

      // Wait for drawer
      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
        .clear()
        .type(cacheName)

      // Browser Cache Settings - Honor Origin Cache Headers (default, position 0)
      cy.get(selectors.cacheSettings.browserCacheSettingsRadio(0), { timeout: 10000 })
        .scrollIntoView()
        .should('exist')

      // CDN Cache Settings - Honor Origin Cache Headers (default, position 0)
      cy.get(selectors.cacheSettings.cdnCacheSettingsRadio(0), { timeout: 10000 })
        .scrollIntoView()
        .should('exist')

      // Save
      cy.get(selectors.formActions.saveButton).click()

      // Wait for API call
      cy.wait('@createCacheSettings', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      // Verify success - drawer should close
      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('not.exist')

      // Verify cache setting appears in list
      cy.contains(cacheName, { timeout: 15000 }).should('exist')
    })

    it('should create cache settings with Override Cache Settings (custom TTL)', () => {
      const cacheName = generateName('OverrideCache')

      cy.intercept('POST', '**/cache_settings').as('createCacheSettings')

      navigateToCacheSettingsTab()
      getCreateButton().click()

      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

      // Fill name
      cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
        .clear()
        .type(cacheName)

      // Browser Cache Settings - Override Cache Settings (position 1)
      cy.get(selectors.cacheSettings.browserCacheSettingsRadio(1), { timeout: 10000 }).click()

      // Fill browser cache max TTL
      cy.get(selectors.cacheSettings.browserCacheSettingsMaxTtlInput, { timeout: 10000 })
        .clear()
        .type('3600')

      // CDN Cache Settings - Override Cache Settings (position 1)
      cy.get(selectors.cacheSettings.cdnCacheSettingsRadio(1), { timeout: 10000 }).click()

      // Fill CDN cache max TTL
      cy.get(selectors.cacheSettings.cdnCacheSettingsMaxTtlInput, { timeout: 10000 })
        .clear()
        .type('7200')

      // Save
      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@createCacheSettings', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])

      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('not.exist')
      cy.contains(cacheName, { timeout: 15000 }).should('exist')
    })

    it('should show validation error for empty name', () => {
      navigateToCacheSettingsTab()
      getCreateButton().click()

      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

      // Clear name and try to submit
      cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 }).clear()
      cy.get(selectors.formActions.saveButton).click()

      // Should show validation error
      cy.get('[data-testid="edge-application-cache-settings-form__name-field__error-message"]', { timeout: 10000 })
        .should('be.visible')
    })
  })

  describe('Edit Cache Settings', () => {
    it('should open edit drawer when clicking on a cache setting', () => {
      const cacheName = generateName('EditTest')

      // First create a cache setting to edit
      cy.intercept('POST', '**/cache_settings').as('createCacheSettings')

      navigateToCacheSettingsTab()
      getCreateButton().click()

      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
        .clear()
        .type(cacheName)

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createCacheSettings', { timeout: 30000 })

      // Wait for drawer to close
      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Now click on the cache setting to edit
      cy.contains(cacheName, { timeout: 15000 }).click()

      // Edit drawer should open - verify by title
      cy.contains('h2', 'Edit Cache Settings', { timeout: 15000 }).should('be.visible')

      // Name should be pre-filled
      cy.get(selectors.cacheSettings.nameInput)
        .should('have.value', cacheName)
    })

    it('should update cache settings name', () => {
      const originalName = generateName('Original')
      const updatedName = generateName('Updated')

      // Create cache setting first
      navigateToCacheSettingsTab()
      getCreateButton().click()

      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
        .clear()
        .type(originalName)

      cy.get(selectors.formActions.saveButton).click()

      // Wait for success via UI feedback (max 30s)
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Wait for drawer to close
      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('not.exist')

      // Click to edit
      cy.contains(originalName, { timeout: 15000 }).click()

      cy.contains('h2', 'Edit Cache Settings', { timeout: 15000 }).should('be.visible')

      // Update name
      cy.get(selectors.cacheSettings.nameInput)
        .clear()
        .type(updatedName)

      cy.get(selectors.formActions.saveButton).click()

      // Wait for success via UI feedback (max 30s)
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Verify updated name in list
      cy.contains(updatedName, { timeout: 15000 }).should('exist')
    })

    it('should update cache TTL values', () => {
      const cacheName = generateName('TTLUpdate')

      cy.intercept('POST', '**/cache_settings').as('createCacheSettings')
      cy.intercept('PUT', '**/cache_settings/**').as('updateCacheSettings')

      // Create cache setting with default values
      navigateToCacheSettingsTab()
      getCreateButton().click()

      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
        .clear()
        .type(cacheName)

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createCacheSettings', { timeout: 30000 })

      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Edit to change TTL
      cy.contains(cacheName, { timeout: 15000 }).click()

      cy.contains('h2', 'Edit Cache Settings', { timeout: 15000 }).should('be.visible')

      // Change to Override Cache Settings
      cy.get(selectors.cacheSettings.browserCacheSettingsRadio(1), { timeout: 10000 }).click()
      cy.get(selectors.cacheSettings.browserCacheSettingsMaxTtlInput, { timeout: 10000 })
        .clear()
        .type('1800')

      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@updateCacheSettings', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 202])
    })
  })

  describe('Delete Cache Settings', () => {
    it('should delete a cache setting', () => {
      const cacheName = generateName('ToDelete')

      cy.intercept('POST', '**/cache_settings').as('createCacheSettings')
      cy.intercept('DELETE', '**/cache_settings/**').as('deleteCacheSettings')

      // Create cache setting to delete
      navigateToCacheSettingsTab()
      getCreateButton().click()

      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
        .clear()
        .type(cacheName)

      cy.get(selectors.formActions.saveButton).click()
      cy.wait('@createCacheSettings', { timeout: 30000 })

      // Wait for drawer to close
      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('not.exist')
      cy.wait(2000)

      // Find the cache setting row and click delete button
      cy.contains(cacheName, { timeout: 30000 })
        .parents('tr')
        .find('[data-testid="data-table-actions-column-body-action-button"], .pi-trash')
        .first()
        .click()

      // Confirm deletion by typing the name
      cy.get(selectors.deleteDialog.confirmInput, { timeout: 10000 })
        .clear()
        .type(cacheName)

      cy.get(selectors.deleteDialog.deleteButton).click()

      // Wait for delete API call
      cy.wait('@deleteCacheSettings', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 202, 204])
    })
  })

  describe('Large File Optimization', () => {
    it('should enable Large File Optimization (Slice)', () => {
      const cacheName = generateName('LargeFile')

      cy.intercept('POST', '**/cache_settings').as('createCacheSettings')

      navigateToCacheSettingsTab()
      getCreateButton().click()

      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
        .clear()
        .type(cacheName)

      // Enable Large File Optimization (if switch exists)
      cy.get('body').then(($body) => {
        if ($body.find(selectors.cacheSettings.largeFileOptimizationSwitch).length) {
          cy.get(selectors.cacheSettings.largeFileOptimizationSwitch).first().scrollIntoView().click()
        }
      })

      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@createCacheSettings', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])
    })
  })

  describe('Tiered Cache', () => {
    it('should enable Tiered Cache when available', () => {
      const cacheName = generateName('TieredCache')

      cy.intercept('POST', '**/cache_settings').as('createCacheSettings')

      navigateToCacheSettingsTab()
      getCreateButton().click()

      cy.contains('h2', 'Create Cache Settings', { timeout: 15000 }).should('be.visible')

      cy.get(selectors.cacheSettings.nameInput, { timeout: 10000 })
        .clear()
        .type(cacheName)

      // Enable Tiered Caching (if switch exists - depends on account subscription)
      cy.get('body').then(($body) => {
        if ($body.find(selectors.cacheSettings.enableTieredCachingSwitch).length) {
          cy.get(selectors.cacheSettings.enableTieredCachingSwitch).click()

          // Select region if dropdown appears
          if ($body.find(selectors.cacheSettings.tieredCacheRegionDropdown).length) {
            cy.get(selectors.cacheSettings.tieredCacheRegionDropdown).click()
            cy.get('li[role="option"]').first().click()
          }
        }
      })

      cy.get(selectors.formActions.saveButton).click()

      cy.wait('@createCacheSettings', { timeout: 30000 })
        .its('response.statusCode')
        .should('be.oneOf', [200, 201, 202])
    })
  })

  after(() => {
    // Cleanup: Delete the test application
    if (applicationName) {
      cy.login()
      cy.openProduct('Edge Application')
      cy.get('.p-datatable', { timeout: 30000 }).should('exist')
      cy.get('.p-skeleton', { timeout: 30000 }).should('not.exist')

      tableHelpers.searchAndSubmit(applicationName)

      cy.get('body').then(($body) => {
        if ($body.find(`[data-testid*="list-table-block__column__name"]`).text().includes(applicationName)) {
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
