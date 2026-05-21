/**
 * Predefined investigation panels for Real-Time Events.
 *
 * Each panel maps to a dataset and provides:
 *  - Pre-selected fields relevant to the investigation context
 *  - A list of Metrics dashboard IDs the user can browse for context
 *
 * No fixed filters are applied — the user has full control via the
 * AdvancedFilterSystem, just like Log Explorer.
 *
 * `metricsDashboardIds` references dashboard IDs from
 * src/modules/real-time-metrics/constants/dashboards.js
 * These are shown as a dropdown so the user can pick which Metrics
 * perspective to overlay (WAF Threats, Status Codes, Bot Manager, etc.)
 */

export const PREDEFINED_PANELS = [
  {
    id: 'security',
    label: 'Security',
    icon: 'pi pi-shield',
    description: 'Investigate WAF threats, bot activity, status codes, and attack patterns',
    type: 'predefined',
    charts: [],
    eventsConfig: {
      dataset: 'workloadEvents',
      defaultFilters: [],
      defaultSelectedFields: [
        'host',
        'requestUri',
        'remoteAddress',
        'status',
        'wafMatch',
        'requestMethod'
      ]
    },
    // Metrics dashboards available in this panel context (Secure group)
    metricsDashboardIds: [
      '357548675837198933', // WAF — Threats
      '357548675837198934', // Threats Breakdown
      '371360344901061482', // Bot Manager — Overview
      '659868342290523846', // Bot Manager — Breakdown
      '357549371218199119', // Edge DNS — Standard Queries
      '357548642810200653' // Status Codes (from Build, but relevant for security)
    ],
    colorScheme: {
      primary: 'var(--series-five-color)',
      secondary: 'var(--text-color-secondary)'
    }
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: 'pi pi-chart-line',
    description: 'Analyze latency, throughput, cache offload, and request patterns',
    type: 'predefined',
    charts: [],
    eventsConfig: {
      dataset: 'workloadEvents',
      defaultFilters: [],
      defaultSelectedFields: ['host', 'status', 'requestUri', 'upstreamCacheStatus', 'requestTime']
    },
    // Metrics dashboards available in this panel context (Build group)
    metricsDashboardIds: [
      '357548608166298191', // Data Transferred
      '357548623571976783', // Requests
      '357548642810200653', // Status Codes
      '357549179454620239', // Bandwidth Saving
      '357549179454620240', // Request Breakdown
      '357549371218199219' // Tiered Cache — Caching Offload
    ],
    colorScheme: {
      primary: 'var(--series-two-color)',
      secondary: 'var(--series-three-color)'
    }
  },
  {
    id: 'edge-functions',
    label: 'Edge Functions',
    icon: 'pi pi-code',
    description: 'Debug function invocations, console output, and execution errors',
    type: 'predefined',
    charts: [],
    eventsConfig: {
      dataset: 'functionConsoleEvents',
      defaultFilters: [],
      defaultSelectedFields: ['functionId', 'level', 'line', 'lineSource']
    },
    // Metrics dashboards available in this panel context
    metricsDashboardIds: [
      '357549319029523021' // Edge Functions — Invocations
    ],
    colorScheme: {
      primary: 'var(--series-three-color)',
      secondary: 'var(--series-five-color)'
    }
  }
]
