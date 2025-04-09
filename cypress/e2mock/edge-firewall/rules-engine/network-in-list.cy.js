/* eslint-disable cypress/no-unnecessary-waiting */
import selectors from '../../../support/selectors'

describe('Edge Firewall Rules Engine with Network List', { tags: ['@dev6'] }, () => {
  const MOCK_EDGE_FIREWALL_ID = '1234'
  const MOCK_RULE_ID = '5678'
  const MOCK_NETWORK_LIST_ID = '9012'
  const MOCK_NETWORK_LIST_NAME = 'Special Network List'

  beforeEach(() => {
    cy.login()

    cy.intercept('GET', '/api/v4/edge_firewall/firewalls*', {
      statusCode: 200,
      body: {
        count: 1,
        total_pages: 1,
        schema_version: 3,
        links: {
          previous: null,
          next: null
        },
        results: [
          {
            id: MOCK_EDGE_FIREWALL_ID,
            name: 'Test Edge Firewall',
            is_active: true,
            last_editor: 'user@example.com',
            last_modified: '2023-01-01T00:00:00Z',
            edge_functions: true,
            network_protection: true,
            waf: true,
            debug_rules: true
          }
        ]
      }
    }).as('listEdgeFirewalls')
    cy.openProduct('Edge Firewall')
    cy.wait('@listEdgeFirewalls')

    cy.intercept('GET', `/api/v4/edge_firewall/firewalls/${MOCK_EDGE_FIREWALL_ID}`, {
      statusCode: 200,
      body: {
        data: {
          id: MOCK_EDGE_FIREWALL_ID,
          name: 'Test Edge Firewall',
          active: true,
          last_editor: 'user@example.com',
          last_modified: '2023-01-01T00:00:00Z',
          debug_rules: true,
          modules: {
            edge_functions_enabled: true,
            network_protection_enabled: true,
            waf_enabled: true
          },
          domains: ['example.com']
        }
      }
    }).as('loadEdgeFirewall')

    cy.intercept('GET', `/api/v3/edge_firewall/${MOCK_EDGE_FIREWALL_ID}/functions_instances*`, {
      statusCode: 200,
      body: {
        count: 0,
        total_pages: 1,
        schema_version: 3,
        links: {
          previous: null,
          next: null
        },
        results: []
      }
    }).as('listEdgeFirewallFunctions')

    cy.intercept('GET', `/api/v4/edge_firewall/firewalls/${MOCK_EDGE_FIREWALL_ID}/rules*`, {
      statusCode: 200,
      body: {
        count: 1,
        results: [
          {
            id: MOCK_RULE_ID,
            name: 'teste',
            last_editor: 'cypress_email_stage+prod2@zohomail.com',
            last_modified: '2025-04-07T16:51:21.922062Z',
            active: true,
            description: ''
          }
        ]
      }
    }).as('listRules')

    cy.intercept(
      'GET',
      `/api/v4/edge_firewall/firewalls/${MOCK_EDGE_FIREWALL_ID}/rules/${MOCK_RULE_ID}`,
      {
        statusCode: 200,
        body: {
          data: {
            id: MOCK_RULE_ID,
            name: 'teste',
            last_editor: 'cypress_email_stage+prod2@zohomail.com',
            last_modified: '2025-04-07T16:51:21.922062Z',
            active: true,
            behaviors: [
              {
                name: 'deny',
                argument: null
              }
            ],
            criteria: [
              [
                {
                  argument: MOCK_NETWORK_LIST_ID,
                  variable: '${network}',
                  conditional: 'if',
                  operator: 'is_not_in_list'
                }
              ]
            ],
            description: '',
            order: 0
          }
        }
      }
    ).as('loadRule')
    cy.get(selectors.edgeFirewall.nameRow).first().click()
    cy.wait('@loadEdgeFirewall')

    cy.get(selectors.edgeFirewall.rulesEngineTab).click()
    cy.wait('@listRules')
    cy.wait('@listEdgeFirewallFunctions')
  })

  it('should load a rule with network list criteria and verify the network list name is displayed', () => {
    cy.intercept('GET', '/api/v4/workspace/network_lists*', {
      statusCode: 200,
      body: {
        count: 0,
        results: []
      }
    }).as('listNetworkLists')
    cy.intercept('GET', `/api/v4/workspace/network_lists/${MOCK_NETWORK_LIST_ID}`, {
      statusCode: 200,
      body: {
        data: {
          id: parseInt(MOCK_NETWORK_LIST_ID),
          name: MOCK_NETWORK_LIST_NAME,
          type: 'ip_cidr',
          items: ['192.168.1.1/32'],
          last_editor: 'user@example.com',
          last_modified: '2023-01-01T00:00:00Z'
        }
      }
    }).as('loadNetworkList')

    cy.get(selectors.edgeFirewall.rulesTableColumnName).first().click({ force: true })
    cy.wait('@loadRule')
    cy.wait('@listNetworkLists')
    cy.wait('@loadNetworkList')

    cy.contains(MOCK_NETWORK_LIST_NAME).should('exist')
  })
})
