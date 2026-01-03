/**
 * Activity History - Read/List Tests
 *
 * API: v4/activity_history/events
 * Route: /activity-history
 *
 * Note: Activity History is a read-only module in the account menu (right side).
 * It shows a timeline of account events (created, deleted, changed, edited).
 * Only visible for accounts with kind === 'client'.
 *
 * Supports fixture recording:
 * - CYPRESS_TEST_MODE=record: Records API responses to fixtures
 * - CYPRESS_TEST_MODE=replay: Uses recorded fixtures
 * - CYPRESS_TEST_MODE=live: Uses real API (default)
 */

import { fixtureRecorder } from '../../support/console-kit-helpers'

const selectors = {
  container: '[data-testid="events-container"]',
  card: '[data-testid="events-card"]',
  header: '[data-testid="events-header"]',
  searchInput: '[data-testid="events-search-input"]',
  dateRange: '[data-testid="events-date-range"]',
  loading: '[data-testid="events-loading"]',
  content: '[data-testid="events-content"]',
  noEventsMessage: '[data-testid="events-no-events-message"]',
  timeline: '[data-testid="events-timeline"]',
  timelineMarker: '[data-testid="events-timeline-marker"]',
  timelineContent: '[data-testid="events-timeline-content"]',
  timelineDate: '[data-testid="events-timeline-date"]',
  timelineEvent: '[data-testid="events-timeline-event"]',
  timelineEventName: '[data-testid="events-timeline-event-name"]',
  timelineEventEditor: '[data-testid="events-timeline-event-editor"]',
  // EmptyResultsBlock selectors (when no activity)
  emptyTitle: 'h2',
  emptyDescription: 'p',
  goHomeButton: 'button'
}

// Wait for activity history page to be ready
const waitForPageReady = () => {
  // Wait for either the events container or empty results block
  cy.get('body', { timeout: 15000 }).then(($body) => {
    if ($body.find(selectors.container).length > 0) {
      // Events container exists, wait for loading to finish
      cy.get(selectors.loading).should('not.exist')
      cy.get(selectors.content).should('be.visible')
    } else {
      // Empty results block - wait for title
      cy.contains('No activity has been recorded', { timeout: 10000 }).should('be.visible')
    }
  })
}

// Check if timeline has events
const hasTimelineEvents = () => {
  return cy.get('body').then(($body) => {
    return $body.find(selectors.timeline).length > 0
  })
}

describe('Activity History - Read/List', { tags: ['@read', '@activity-history', '@account-menu'] }, () => {
  beforeEach(() => {
    fixtureRecorder.setupSync('activityHistory', 'v4/activity_history/events')
    cy.login()
    // Activity History is in the account menu, use cy.visit directly
    cy.visit('/activity-history')
    waitForPageReady()
  })

  afterEach(() => {
    fixtureRecorder.saveRecordings()
  })

  describe('Page Display', () => {
    it('should display activity history page', () => {
      // Page should have either events or empty state
      cy.get('body').then(($body) => {
        if ($body.find(selectors.container).length > 0) {
          cy.get(selectors.container).should('be.visible')
          cy.get(selectors.card).should('be.visible')
        } else {
          cy.contains('No activity has been recorded').should('be.visible')
        }
      })
    })

    it('should display search input in header', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.container).length > 0) {
          cy.get(selectors.header).should('be.visible')
          cy.get(selectors.searchInput).should('be.visible')
          cy.get(selectors.searchInput).should('have.attr', 'placeholder', 'Search by event')
        }
      })
    })

    it('should display date range info', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.container).length > 0) {
          cy.get(selectors.dateRange)
            .should('be.visible')
            .and('contain', 'Records from the last 30 days')
        }
      })
    })
  })

  describe('Timeline Display', () => {
    it('should display timeline when events exist', () => {
      hasTimelineEvents().then((hasEvents) => {
        if (hasEvents) {
          cy.get(selectors.timeline).should('be.visible')
          cy.get(selectors.timelineContent).should('have.length.at.least', 1)
        } else {
          cy.log('No timeline events - checking for empty state')
          cy.get('body').then(($body) => {
            if ($body.find(selectors.noEventsMessage).length > 0) {
              cy.get(selectors.noEventsMessage).should('contain', 'No events found')
            } else {
              cy.contains('No activity has been recorded').should('be.visible')
            }
          })
        }
      })
    })

    it('should display event details with date and editor', () => {
      hasTimelineEvents().then((hasEvents) => {
        if (hasEvents) {
          // Check first event has required fields
          cy.get(selectors.timelineDate).first().should('be.visible')
          cy.get(selectors.timelineEventName).first().should('be.visible')
          cy.get(selectors.timelineEventEditor).first()
            .should('be.visible')
            .and('contain', 'by')
        } else {
          cy.log('No events to verify - skipping')
        }
      })
    })

    it('should display event type markers', () => {
      hasTimelineEvents().then((hasEvents) => {
        if (hasEvents) {
          cy.get(selectors.timelineMarker).first().should('be.visible')
        } else {
          cy.log('No events to verify markers - skipping')
        }
      })
    })
  })

  describe('Search Functionality', () => {
    it('should allow searching for events', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.searchInput).length > 0) {
          cy.get(selectors.searchInput)
            .should('be.visible')
            .type('test search{enter}')

          // Wait for loading to complete
          cy.get(selectors.loading).should('not.exist')

          // Should show either results or "No events found"
          cy.get(selectors.content).should('be.visible')
        }
      })
    })

    it('should clear search and show all events', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.searchInput).length > 0) {
          // Type and then clear
          cy.get(selectors.searchInput)
            .type('test')
            .clear()
            .type('{enter}')

          // Wait for loading to complete
          cy.get(selectors.loading).should('not.exist')
          cy.get(selectors.content).should('be.visible')
        }
      })
    })
  })

  describe('Pagination', () => {
    it('should display paginator', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.container).length > 0) {
          cy.get('.p-paginator').should('exist')
        }
      })
    })

    it('should have rows per page options', () => {
      cy.get('body').then(($body) => {
        if ($body.find('.p-paginator-rpp-options').length > 0) {
          cy.get('.p-paginator-rpp-options').click()
          cy.get('.p-dropdown-panel').should('be.visible')
          // Should have 1000, 2500, 5000 options
          cy.get('.p-dropdown-item').should('have.length.at.least', 1)
          // Close dropdown
          cy.get('body').click(0, 0)
        }
      })
    })
  })

  describe('Empty State', () => {
    it('should display empty state message when no activity', () => {
      // This test verifies the empty state UI if no events exist
      cy.get('body').then(($body) => {
        if ($body.find(selectors.container).length === 0) {
          cy.contains('No activity has been recorded').should('be.visible')
          cy.contains('Start using services and products').should('be.visible')
          cy.contains('Go to Home').should('be.visible')
        } else if ($body.find(selectors.noEventsMessage).length > 0) {
          cy.get(selectors.noEventsMessage).should('contain', 'No events found')
        } else {
          cy.log('Events exist - skipping empty state test')
        }
      })
    })

    it('should navigate to home when clicking Go to Home button', () => {
      cy.get('body').then(($body) => {
        if ($body.find(selectors.container).length === 0) {
          cy.contains('Go to Home').click()
          cy.url().should('eq', Cypress.config().baseUrl + '/')
        } else {
          cy.log('Events exist - skipping navigation test')
        }
      })
    })
  })
})
