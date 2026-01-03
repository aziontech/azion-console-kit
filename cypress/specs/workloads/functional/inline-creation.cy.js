/**
 * Workloads - Inline Creation Tests
 *
 * Tests: Creating Edge Application and Edge Firewall inline
 * from the Workload creation form (drawer flows)
 *
 * Supports 3 modes:
 * - LIVE: Executa contra API real (padrão)
 * - RECORD: Executa contra API real e grava fixtures
 * - REPLAY: Usa fixtures gravadas (functional test)
 *
 * Para gravar fixtures:
 *   CYPRESS_TEST_MODE=record npx cypress run --spec "cypress/specs/workloads/functional/inline-creation.cy.js"
 *
 * Para rodar testes funcionais (com fixtures):
 *   CYPRESS_TEST_MODE=replay npx cypress run --spec "cypress/specs/workloads/functional/inline-creation.cy.js"
 */

import { fixtureRecorder, tableHelpers } from '../../../support/console-kit-helpers'
import selectors from '../../../support/selectors/product-selectors/workload'

// API endpoints used in these tests
const WORKLOADS_API = 'v4/workspace/workloads'
const APPLICATIONS_API = 'v4/workspace/applications'
const FIREWALLS_API = 'v4/workspace/firewalls'
const CERTIFICATES_API = 'v4/digital_certificates/certificates'
const TEAMS_API = 'v4/iam/teams'

// Fixed names for replay mode (must match recorded fixtures)
const FIXTURE_NAMES = {
  edgeApp: 'InlineEdgeApp-fixture',
  firewall: 'InlineFirewall-fixture',
  workload: 'FullInlineWorkload-fixture',
  fullFlowApp: 'FullInlineApp-fixture'
}

// Generate name based on mode
const generateName = (prefix = 'Inline', fixtureName = null) => {
  const mode = fixtureRecorder.getMode()
  if (mode === 'replay' && fixtureName) {
    return fixtureName
  }
  return `${prefix}-${Date.now()}`
}

describe('Workloads - Inline Creation', { tags: ['@functional', '@workloads', '@inline'] }, () => {
  const createdWorkloads = []
  const createdEdgeApps = []
  const createdFirewalls = []

  beforeEach(() => {
    const mode = fixtureRecorder.getMode()
    const profile = fixtureRecorder.getProfileName()

    cy.log(`Test mode: ${mode}, Profile: ${profile}`)

    if (mode === 'replay') {
      // REPLAY mode: mock all API responses
      setupReplayIntercepts()
    } else {
      // RECORD or LIVE mode: setup intercepts for recording/waiting
      setupLiveIntercepts()
    }

    cy.login()
    // Wait for page to be fully loaded after login
    cy.get('[data-testid="sidebar-block__toggle-button"]', { timeout: 30000 }).should('exist')
    cy.openProduct('Domains')
    tableHelpers.waitForListReady()
  })

  afterEach(() => {
    // Save recordings after each test (only executes in record mode)
    fixtureRecorder.saveRecordings()
  })

  /**
   * Setup intercepts for REPLAY mode (uses inline mocks for creation responses)
   */
  function setupReplayIntercepts() {
    // Mock application creation - return the fixture name
    cy.intercept('POST', `**/${APPLICATIONS_API}`, {
      statusCode: 202,
      body: {
        state: 'pending',
        data: {
          id: 1234567890,
          name: FIXTURE_NAMES.edgeApp,
          active: true
        }
      }
    }).as('ApplicationsCreate')

    // Mock firewall creation - return the fixture name
    cy.intercept('POST', `**/${FIREWALLS_API}`, {
      statusCode: 202,
      body: {
        state: 'pending',
        data: {
          id: 1234567891,
          name: FIXTURE_NAMES.firewall,
          active: true
        }
      }
    }).as('FirewallsCreate')

    // Mock workload creation - return the fixture name
    cy.intercept('POST', `**/${WORKLOADS_API}`, {
      statusCode: 202,
      body: {
        state: 'pending',
        data: {
          id: 1234567892,
          name: FIXTURE_NAMES.workload,
          domain_name: 'fixture.map.azionedge.net',
          active: true
        }
      }
    }).as('WorkloadsCreate')

    // Pass through list endpoints (they load from real API in beforeEach)
    cy.intercept('GET', `**/${WORKLOADS_API}*`).as('WorkloadsList')
    cy.intercept('GET', `**/${APPLICATIONS_API}*`).as('ApplicationsList')
    cy.intercept('GET', `**/${FIREWALLS_API}*`).as('FirewallsList')
    cy.intercept('GET', `**/${CERTIFICATES_API}*`).as('CertificatesList')
    cy.intercept('GET', `**/${TEAMS_API}*`).as('TeamsList')
  }

  /**
   * Setup intercepts for LIVE/RECORD mode
   */
  function setupLiveIntercepts() {
    const mode = fixtureRecorder.getMode()

    // Workloads
    cy.intercept('GET', `**/${WORKLOADS_API}*`, (req) => {
      if (mode === 'record') {
        req.continue((res) => {
          fixtureRecorder.recordings['workloads_list'] = {
            timestamp: new Date().toISOString(),
            url: req.url,
            method: req.method,
            statusCode: res.statusCode,
            body: res.body
          }
        })
      } else {
        req.continue()
      }
    }).as('WorkloadsList')

    cy.intercept('POST', `**/${WORKLOADS_API}`, (req) => {
      if (mode === 'record') {
        req.continue((res) => {
          fixtureRecorder.recordings['workloads_create-workload'] = {
            timestamp: new Date().toISOString(),
            url: req.url,
            method: req.method,
            statusCode: res.statusCode,
            body: res.body,
            requestBody: req.body
          }
        })
      } else {
        req.continue()
      }
    }).as('WorkloadsCreate')

    // Applications
    cy.intercept('GET', `**/${APPLICATIONS_API}*`, (req) => {
      if (mode === 'record') {
        req.continue((res) => {
          fixtureRecorder.recordings['workloads_applications-list'] = {
            timestamp: new Date().toISOString(),
            url: req.url,
            method: req.method,
            statusCode: res.statusCode,
            body: res.body
          }
        })
      } else {
        req.continue()
      }
    }).as('ApplicationsList')

    cy.intercept('POST', `**/${APPLICATIONS_API}`, (req) => {
      if (mode === 'record') {
        req.continue((res) => {
          fixtureRecorder.recordings['workloads_create-application'] = {
            timestamp: new Date().toISOString(),
            url: req.url,
            method: req.method,
            statusCode: res.statusCode,
            body: res.body,
            requestBody: req.body
          }
        })
      } else {
        req.continue()
      }
    }).as('ApplicationsCreate')

    // Firewalls
    cy.intercept('GET', `**/${FIREWALLS_API}*`, (req) => {
      if (mode === 'record') {
        req.continue((res) => {
          fixtureRecorder.recordings['workloads_firewalls-list'] = {
            timestamp: new Date().toISOString(),
            url: req.url,
            method: req.method,
            statusCode: res.statusCode,
            body: res.body
          }
        })
      } else {
        req.continue()
      }
    }).as('FirewallsList')

    cy.intercept('POST', `**/${FIREWALLS_API}`, (req) => {
      if (mode === 'record') {
        req.continue((res) => {
          fixtureRecorder.recordings['workloads_create-firewall'] = {
            timestamp: new Date().toISOString(),
            url: req.url,
            method: req.method,
            statusCode: res.statusCode,
            body: res.body,
            requestBody: req.body
          }
        })
      } else {
        req.continue()
      }
    }).as('FirewallsCreate')

    // Certificates
    cy.intercept('GET', `**/${CERTIFICATES_API}*`, (req) => {
      if (mode === 'record') {
        req.continue((res) => {
          fixtureRecorder.recordings['workloads_certificates-list'] = {
            timestamp: new Date().toISOString(),
            url: req.url,
            method: req.method,
            statusCode: res.statusCode,
            body: res.body
          }
        })
      } else {
        req.continue()
      }
    }).as('CertificatesList')

    // Teams
    cy.intercept('GET', `**/${TEAMS_API}*`, (req) => {
      if (mode === 'record') {
        req.continue((res) => {
          fixtureRecorder.recordings['workloads_teams-list'] = {
            timestamp: new Date().toISOString(),
            url: req.url,
            method: req.method,
            statusCode: res.statusCode,
            body: res.body
          }
        })
      } else {
        req.continue()
      }
    }).as('TeamsList')
  }

  describe('Inline Edge Application Creation', () => {
    /**
     * Helper to navigate to Edge Application dropdown
     * The dropdown is in "Deployment Settings" section
     */
    const navigateToEdgeAppDropdown = () => {
      // First scroll to "Deployment Settings" section title
      // FormHorizontal uses .text-xl for titles
      cy.contains('.text-xl', 'Deployment Settings', { timeout: 15000 })
        .scrollIntoView()
        .should('be.visible')

      // Wait for dropdown to finish loading
      cy.get('[data-testid="domains-form__edge-application-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Small wait for any animations
      cy.wait(500)
    }

    it('should show create Edge Application button', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()
      cy.url().should('include', '/create')

      navigateToEdgeAppDropdown()

      // Click the dropdown trigger to open it
      // appendTo="self" means the panel renders inside the component
      cy.get('[data-testid="domains-form__edge-application-field__dropdown-trigger"]', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Create Edge Application button should exist in dropdown footer
      cy.get(selectors.createEdgeApplicationButton, { timeout: 10000 }).should('exist')
    })

    it('should open Edge Application drawer when clicking create button', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      navigateToEdgeAppDropdown()

      // Click the dropdown trigger to open
      cy.get('[data-testid="domains-form__edge-application-field__dropdown-trigger"]', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Wait for create button to be visible and click it
      cy.get(selectors.createEdgeApplicationButton, { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Drawer should open
      cy.get(selectors.edgeApplicationDrawer, { timeout: 10000 }).should('be.visible')
    })

    it('should create Edge Application inline and auto-select it', () => {
      const edgeAppName = generateName('InlineEdgeApp', FIXTURE_NAMES.edgeApp)
      const mode = fixtureRecorder.getMode()

      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      navigateToEdgeAppDropdown()

      // Click the dropdown trigger to open
      cy.get('[data-testid="domains-form__edge-application-field__dropdown-trigger"]', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Wait for create button and click it
      cy.get(selectors.createEdgeApplicationButton, { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Wait for drawer to be visible (uses .p-sidebar-content)
      cy.get(selectors.edgeApplicationDrawer, { timeout: 10000 }).should('be.visible')

      // Fill Edge Application name using correct selector
      cy.get('[data-testid="form-horizontal-general-name__input"]', { timeout: 10000 })
        .clear()
        .type(edgeAppName)

      // Save Edge Application
      cy.get(selectors.edgeApplicationSaveButton, { timeout: 10000 }).click()

      // Wait for success toast (max 30s)
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Drawer should close
      cy.get(selectors.edgeApplicationDrawer, { timeout: 10000 }).should('not.exist')

      // Edge Application dropdown should have the new app selected
      cy.get(selectors.edgeApplicationField, { timeout: 10000 })
        .should('contain.text', edgeAppName)

      // Only track for cleanup in live/record mode
      if (mode !== 'replay') {
        createdEdgeApps.push(edgeAppName)
      }
    })
  })

  describe('Inline Edge Firewall Creation', () => {
    /**
     * Helper to navigate to Firewall dropdown
     * The Edge Firewall dropdown is in "Deployment Settings" section
     * We need to scroll to the section FIRST, then interact with dropdown
     */
    const navigateToFirewallDropdown = () => {
      // First scroll to "Deployment Settings" section title
      // FormHorizontal uses .text-xl for titles
      cy.contains('.text-xl', 'Deployment Settings', { timeout: 15000 })
        .scrollIntoView()
        .should('be.visible')

      // Wait for dropdown to finish loading
      cy.get('[data-testid="domains-form__edge-firewall-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Small wait for any animations
      cy.wait(500)
    }

    it('should show create Edge Firewall button', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      navigateToFirewallDropdown()

      // Click the dropdown trigger to open
      cy.get('[data-testid="domains-form__edge-firewall-field__dropdown-trigger"]', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Create Edge Firewall button should exist in dropdown footer
      cy.get(selectors.createEdgeFirewallButton, { timeout: 10000 }).should('be.visible')
    })

    it('should open Edge Firewall drawer when clicking create button', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      navigateToFirewallDropdown()

      // Click the dropdown trigger to open
      cy.get('[data-testid="domains-form__edge-firewall-field__dropdown-trigger"]', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Wait for create button and click it
      cy.get(selectors.createEdgeFirewallButton, { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Drawer should open (with action bar)
      cy.get(selectors.edgeFirewallActionBar, { timeout: 10000 }).should('exist')
    })

    it('should create Edge Firewall inline and auto-select it', () => {
      const firewallName = generateName('InlineFirewall', FIXTURE_NAMES.firewall)
      const mode = fixtureRecorder.getMode()

      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      navigateToFirewallDropdown()

      // Click the dropdown trigger to open
      cy.get('[data-testid="domains-form__edge-firewall-field__dropdown-trigger"]', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Open Edge Firewall drawer
      cy.get(selectors.createEdgeFirewallButton, { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Wait for drawer to be visible (action bar indicates drawer is open)
      cy.get(selectors.edgeFirewallActionBar, { timeout: 10000 }).should('be.visible')

      // Fill Edge Firewall name using correct selector
      cy.get('[data-testid="edge-firewall-form__name-field__input"]', { timeout: 10000 })
        .clear()
        .type(firewallName)

      // Save Edge Firewall
      cy.get(selectors.edgeFirewallSaveButton, { timeout: 10000 }).click()

      // Wait for success toast (max 30s)
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Drawer should close (action bar should not exist)
      cy.get(selectors.edgeFirewallActionBar, { timeout: 10000 }).should('not.exist')

      // Edge Firewall dropdown should have the new firewall selected
      cy.get(selectors.edgeFirewallField, { timeout: 10000 })
        .should('contain.text', firewallName)

      // Only track for cleanup in live/record mode
      if (mode !== 'replay') {
        createdFirewalls.push(firewallName)
      }
    })
  })

  describe('Inline Digital Certificate Creation', () => {
    it('should show create Digital Certificate button when HTTPS enabled', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section and enable HTTPS
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Wait for certificate dropdown to load
      cy.get('[data-testid="domains-form__edge-certificate-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Create Digital Certificate button should exist (in the dropdown footer)
      cy.get('[data-testid="domains-form__edge-certificate-field__dropdown"]', { timeout: 10000 })
        .scrollIntoView()
        .click()

      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')
      cy.get(selectors.createDigitalCertificateButton, { timeout: 10000 }).should('exist')
    })

    it('should open Digital Certificate drawer', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Scroll to Protocol Settings section and enable HTTPS
      cy.get(selectors.protocolSettingsSection, { timeout: 15000 }).scrollIntoView()
      cy.get(selectors.useHttpsSwitch, { timeout: 10000 }).then(($switch) => {
        if (!$switch.hasClass('p-inputswitch-checked')) {
          cy.wrap($switch).click()
        }
      })

      // Wait for certificate dropdown to load
      cy.get('[data-testid="domains-form__edge-certificate-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      // Click certificate dropdown to access the create button
      cy.get('[data-testid="domains-form__edge-certificate-field__dropdown"]', { timeout: 10000 })
        .scrollIntoView()
        .click()

      cy.get('.p-dropdown-panel', { timeout: 10000 }).should('be.visible')

      // Click create Digital Certificate button
      cy.get(selectors.createDigitalCertificateButton, { timeout: 10000 }).click()

      // Drawer should open
      cy.get(selectors.digitalCertificateActionBar, { timeout: 10000 }).should('exist')
    })
  })

  describe('Full Inline Creation Flow', () => {
    it('should create workload with inline Edge Application', () => {
      const workloadName = generateName('FullInlineWorkload', FIXTURE_NAMES.workload)
      const edgeAppName = generateName('FullInlineApp', FIXTURE_NAMES.fullFlowApp)
      const mode = fixtureRecorder.getMode()

      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // Wait for form to be ready
      cy.url().should('include', '/create')

      // Wait for the General section to be visible (first section on the form)
      cy.contains('.text-xl', 'General', { timeout: 15000 })
        .scrollIntoView()
        .should('be.visible')

      // Fill workload name - find the first field-text input in the form (which is the name field)
      cy.get(selectors.nameInput, { timeout: 15000 })
        .first()
        .should('be.visible')
        .clear()
        .type(workloadName)

      // Scroll to Deployment Settings section
      cy.contains('.text-xl', 'Deployment Settings', { timeout: 15000 })
        .scrollIntoView()
        .should('be.visible')

      // Wait for dropdown to load
      cy.get('[data-testid="domains-form__edge-application-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      cy.wait(500)

      // Click the dropdown trigger to open
      cy.get('[data-testid="domains-form__edge-application-field__dropdown-trigger"]', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Create Edge Application inline
      cy.get(selectors.createEdgeApplicationButton, { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Wait for drawer to be visible (uses .p-sidebar-content)
      cy.get(selectors.edgeApplicationDrawer, { timeout: 10000 }).should('be.visible')

      // Fill Edge Application name using correct selector
      cy.get('[data-testid="form-horizontal-general-name__input"]', { timeout: 10000 })
        .clear()
        .type(edgeAppName)

      // Save Edge Application
      cy.get(selectors.edgeApplicationSaveButton).click()

      // Wait for success toast
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Drawer should close
      cy.get(selectors.edgeApplicationDrawer, { timeout: 10000 }).should('not.exist')

      // Only track for cleanup in live/record mode
      if (mode !== 'replay') {
        createdEdgeApps.push(edgeAppName)
      }

      // Now save the workload
      cy.get(selectors.formActionsSubmitButton).click()

      // Wait for workload creation success
      cy.get('.p-toast-message-success', { timeout: 30000 }).should('be.visible')

      // Only track for cleanup in live/record mode
      if (mode !== 'replay') {
        createdWorkloads.push(workloadName)
      }
    })
  })

  describe('Clear Edge Firewall Selection', () => {
    it('should clear Edge Firewall selection', () => {
      cy.get('[data-testid*="create"]', { timeout: 15000 }).first().click()

      // First scroll to "Deployment Settings" section title
      // FormHorizontal uses .text-xl for titles
      cy.contains('.text-xl', 'Deployment Settings', { timeout: 15000 })
        .scrollIntoView()
        .should('be.visible')

      // Wait for dropdown to load
      cy.get('[data-testid="domains-form__edge-firewall-field__loading-icon"]', { timeout: 5000 })
        .should('not.exist')

      cy.wait(500)

      // Click the dropdown trigger to open
      cy.get('[data-testid="domains-form__edge-firewall-field__dropdown-trigger"]', { timeout: 10000 })
        .should('be.visible')
        .click({ force: true })

      // Select first option
      cy.get('li[role="option"]', { timeout: 10000 }).then(($options) => {
        if ($options.length > 0) {
          cy.wrap($options).first().click()

          // Clear icon should appear
          cy.get(selectors.edgeFirewallClearIcon, { timeout: 10000 }).should('exist')

          // Click clear
          cy.get(selectors.edgeFirewallClearIcon).click({ force: true })

          // Selection should be cleared - dropdown should show placeholder
          cy.get('[data-testid="domains-form__edge-firewall-field__dropdown"]')
            .should('contain.text', 'Select')
        }
      })
    })
  })

  after(() => {
    const mode = fixtureRecorder.getMode()

    // Skip cleanup in replay mode (nothing was actually created)
    if (mode === 'replay') {
      cy.log('Replay mode - skipping cleanup')
      return
    }

    // Log what we need to clean up
    cy.log(`Cleanup: ${createdWorkloads.length} workloads, ${createdEdgeApps.length} edge apps, ${createdFirewalls.length} firewalls`)

    // Skip cleanup if nothing was created
    if (createdWorkloads.length === 0 && createdEdgeApps.length === 0 && createdFirewalls.length === 0) {
      return
    }

    // Helper to safely delete an item from a list
    const deleteItem = (name) => {
      cy.get('body', { timeout: 5000 }).then(($body) => {
        // Check if item exists in the list
        if (!$body.text().includes(name)) {
          cy.log(`Item "${name}" not found, skipping`)
          return
        }

        tableHelpers.searchAndSubmit(name)
        cy.wait(1000)

        // Wait for search to complete and check if item is still visible
        cy.get('body').then(($searchBody) => {
          if (!$searchBody.text().includes(name)) {
            cy.log(`Item "${name}" not found after search, skipping`)
            return
          }

          // Open actions menu using tableHelpers
          tableHelpers.openRowActionsMenu(0)

          // Wait for menu and click Delete
          cy.wait(300)
          tableHelpers.clickRowAction('Delete')

          // Fill confirmation dialog
          cy.get('[data-testid="delete-dialog-confirmation-input-field"]', { timeout: 10000 })
            .clear()
            .type(name)

          // Click delete button
          cy.get('[data-testid="delete-dialog-footer-delete-button"]').click()

          // Wait for deletion to complete (allow up to 30s for API response)
          cy.get('.p-toast-message-success, .p-toast-message-info', { timeout: 30000 }).should('exist')
          cy.wait(1000)
        })
      })
    }

    // Cleanup workloads
    if (createdWorkloads.length > 0) {
      cy.login()
      cy.openProduct('Domains')
      tableHelpers.waitForListReady()

      createdWorkloads.forEach((name) => {
        deleteItem(name)
      })
    }

    // Cleanup Edge Applications
    if (createdEdgeApps.length > 0) {
      cy.login()
      cy.openProduct('Edge Application')
      tableHelpers.waitForListReady()

      createdEdgeApps.forEach((name) => {
        deleteItem(name)
      })
    }

    // Cleanup Edge Firewalls
    if (createdFirewalls.length > 0) {
      cy.login()
      cy.openProduct('Edge Firewall')
      tableHelpers.waitForListReady()

      createdFirewalls.forEach((name) => {
        deleteItem(name)
      })
    }
  })
})
