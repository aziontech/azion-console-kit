<template>
  <div class="w-full flex flex-col flex-1 relative">
    <DataTable
      :value="customers"
      rowGroupMode="subheader"
      @rowReorder="onRowReorder"
      groupRowsBy="phase.content"
      v-model:expandedRowGroups="expandedRowGroups"
      sortMode="single"
      @rowgroup-expand="onRowGroupExpand"
      @rowgroup-collapse="onRowGroupCollapse"
      sortField="phase.content"
      :sortOrder="1"
      expandableRowGroups
      scrollable
    >
      <Column
        rowReorder
        headerStyle="width: 3rem"
        :reorderableColumn="false"
      />
      <Column
        field="name"
        header="Name"
        style="min-width: 200px"
      />
      <Column
        field="country"
        header="Country"
        style="min-width: 200px"
      >
      </Column>
      <Column
        field="company"
        header="Company"
        style="min-width: 200px"
      />
      <Column
        field="status"
        header="Status"
        style="min-width: 200px"
      >
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.status"
            :severity="getSeverity(slotProps.data.status)"
          />
        </template>
      </Column>
      <Column
        field="date"
        header="Date"
        style="min-width: 200px"
      />
      <template #groupheader="slotProps">
        <span class="vertical-align-middle ml-2 font-bold line-height-3">{{
          slotProps.data.phase.content
        }}</span>
      </template>
    </DataTable>
  </div>
</template>

<script setup>
  import { ref } from 'vue'
  import Column from 'primevue/column'
  import DataTable from 'primevue/datatable'
  import Tag from 'primevue/tag'
  const customers = ref([
    {
      id: 315380,
      name: 'Default Rule',
      phase: { content: 'Default', outlined: true, severity: 'info' },
      behaviors: [{ name: 'set_origin', argument: '162360' }],
      criteria: [
        [{ argument: '/', variable: '${uri}', conditional: 'if', operator: 'starts_with' }]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 0,
      description: '-'
    },
    {
      id: 315383,
      name: 'Set Storage Origin for All Requests',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [{ name: 'set_origin', argument: '162361' }],
      criteria: [
        [{ argument: '^\\/', variable: '${uri}', conditional: 'if', operator: 'matches' }]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 1,
      description: 'Sets the default object storage as the origin for all requests.'
    },
    {
      id: 315382,
      name: 'Apply Common Configuration for All Requests',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'add_request_header', argument: 'Accept: application/json; version=3;' },
        { name: 'add_request_header', argument: 'X-Cross-Edge-Secret: undefined' },
        { name: 'add_request_header', argument: 'X-User-Real-IP: ${remote_addr}' },
        { name: 'bypass_cache_phase', argument: '' },
        { name: 'forward_cookies', argument: '' },
        { name: 'redirect_http_to_https', argument: '' }
      ],
      criteria: [
        [{ argument: '^\\/', variable: '${uri}', conditional: 'if', operator: 'matches' }]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 2,
      description:
        'Applies common settings for all requests, including standard headers and HTTP to HTTPS redirection.'
    },
    {
      id: 315384,
      name: 'Deliver Static Assets from Storage',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'set_origin', argument: '162361' },
        { name: 'set_cache_policy', argument: '184157' },
        { name: 'deliver', argument: '' }
      ],
      criteria: [
        [
          {
            argument:
              '.(css|js|ttf|woff|woff2|pdf|svg|jpg|jpeg|gif|bmp|png|ico|mp4|json|xml|html)$',
            variable: '${uri}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 3,
      description:
        'Sets the storage origin and deliver for all requests using the default object storage.'
    },
    {
      id: 315385,
      name: 'Redirect All Non-Asset Requests to to index.html',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [{ name: 'rewrite_request', argument: '/index.html' }],
      criteria: [
        [{ argument: '^\\/', variable: '${uri}', conditional: 'if', operator: 'matches' }]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 4,
      description:
        'Delivers static assets such as CSS, JS, images, and other files directly from object storage.'
    },
    {
      id: 315386,
      name: 'Route API Default Requests to API Origin',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [{ name: 'set_origin', argument: '162366' }],
      criteria: [
        [{ argument: '^/api', variable: '${uri}', conditional: 'if', operator: 'matches' }]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 5,
      description: 'Routes all default API requests to the specific API origin.'
    },
    {
      id: 315387,
      name: 'Route Specific API Services to Marketplace Origin',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'set_origin', argument: '162363' },
        { name: 'forward_cookies', argument: '' },
        {
          name: 'capture_match_groups',
          argument: {
            regex: '/api/marketplace/(.*)',
            captured_array: 'captured',
            subject: '${request_uri}'
          }
        },
        { name: 'rewrite_request', argument: '/marketplace/api/%{captured[1]}' },
        { name: 'set_cache_policy', argument: '184158' }
      ],
      criteria: [
        [
          {
            argument: '^/api/marketplace',
            variable: '${uri}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 6,
      description:
        'Routes marketplace API services to the manager origin, forwarding cookies and bypassing cache.'
    },
    {
      id: 315388,
      name: 'Route Specific API Services to Template Engine Origin',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'set_origin', argument: '162362' },
        { name: 'forward_cookies', argument: '' },
        {
          name: 'capture_match_groups',
          argument: {
            regex: '/api/template-engine/(.*)',
            captured_array: 'captured',
            subject: '${request_uri}'
          }
        },
        { name: 'rewrite_request', argument: '/template-engine/api/%{captured[1]}' },
        { name: 'bypass_cache_phase', argument: '' }
      ],
      criteria: [
        [
          {
            argument: '^/api/template-engine',
            variable: '${uri}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 7,
      description:
        'Routes template-engine API services to the manager origin, forwarding cookies and bypassing cache.'
    },
    {
      id: 315389,
      name: 'Route Specific API Services to Script Runner Origin',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'set_origin', argument: '162362' },
        { name: 'forward_cookies', argument: '' },
        {
          name: 'capture_match_groups',
          argument: {
            regex: '/api/script-runner/(.*)',
            captured_array: 'captured',
            subject: '${request_uri}'
          }
        },
        { name: 'rewrite_request', argument: '/script-runner/api/%{captured[1]}' },
        { name: 'bypass_cache_phase', argument: '' }
      ],
      criteria: [
        [
          {
            argument: '^/api/script-runner',
            variable: '${uri}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 8,
      description:
        'Routes script-runner API services to the script runner origin, forwarding cookies and bypassing cache.'
    },
    {
      id: 315390,
      name: 'Route User Authentication and Account Management to SSO Origin',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'set_origin', argument: '162365' },
        { name: 'forward_cookies', argument: '' },
        { name: 'bypass_cache_phase', argument: '' }
      ],
      criteria: [
        [
          {
            argument: '^/api/(account|user|token|switch-account|auth|password|totp)|^/logout',
            variable: '${uri}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 9,
      description:
        'Routes user authentication and account management requests to the SSO origin, with cookie forwarding and cache bypass.'
    },
    {
      id: 315391,
      name: 'Route GraphQL City Queries to Cities Origin',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'forward_cookies', argument: '' },
        { name: 'set_origin', argument: '162364' },
        { name: 'rewrite_request', argument: '/graphql/' },
        { name: 'set_cache_policy', argument: '184159' }
      ],
      criteria: [
        [
          {
            argument: '^/graphql/cities/',
            variable: '${uri}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 10,
      description: 'Routes GraphQL queries for cities to the specific cities origin.'
    },
    {
      id: 315392,
      name: 'Route GraphQL Billing Queries to Manager Origin',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'forward_cookies', argument: '' },
        { name: 'set_origin', argument: '162362' },
        { name: 'rewrite_request', argument: '/billing/graphql' }
      ],
      criteria: [
        [
          {
            argument: '^/graphql/billing',
            variable: '${uri}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 11,
      description: 'Routes GraphQL Billing queries to the Manager, updating the URI accordingly'
    },
    {
      id: 315393,
      name: 'Route Send Feedback',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'forward_cookies', argument: '' },
        { name: 'set_origin', argument: '162368' },
        { name: 'rewrite_request', argument: '/webhook/console_feedback' }
      ],
      criteria: [
        [
          {
            argument: '^/api/webhook/console_feedback',
            variable: '${uri}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 12,
      description: 'this route will send user feedback to jira'
    },
    {
      id: 315394,
      name: 'Route Send Message to Copilot',
      phase: { content: 'Request', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'forward_cookies', argument: '' },
        { name: 'set_origin', argument: '162367' },
        { name: 'rewrite_request', argument: '/copilot/chat/completions' }
      ],
      criteria: [
        [{ argument: '^/ai', variable: '${uri}', conditional: 'if', operator: 'matches' }]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 13,
      description: 'this router will send the user message to the chatbot'
    },
    {
      id: 315381,
      name: 'enable gzip',
      phase: { content: 'Response', outlined: true, severity: 'info' },
      behaviors: [{ name: 'enable_gzip', argument: '' }],
      criteria: [
        [{ argument: '', variable: '${request_uri}', conditional: 'if', operator: 'exists' }]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 14,
      description: '-'
    },
    {
      id: 315397,
      name: 'Rewrite _azat Cookie',
      phase: { content: 'Response', outlined: true, severity: 'info' },
      behaviors: [
        {
          name: 'capture_match_groups',
          argument: {
            regex: '(.*)',
            captured_array: 'azat_arr',
            subject: '${upstream_cookie__azat}'
          }
        },
        {
          name: 'set_cookie',
          argument: '_azat=%{azat_arr[0]}; Max-Age=1209600; Path=/; SameSite=Lax; Secure'
        },
        { name: 'filter_response_cookie', argument: '_azat' }
      ],
      criteria: [
        [
          {
            argument: '.*',
            variable: '${upstream_cookie__azat}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 15,
      description:
        'Captures and rewrites the _azat cookie from upstream responses, setting secure, domain-specific settings for enhanced security.'
    },
    {
      id: 315395,
      name: 'Rewrite _azrt Cookie',
      phase: { content: 'Response', outlined: true, severity: 'info' },
      behaviors: [
        {
          name: 'capture_match_groups',
          argument: {
            regex: '(.*)',
            captured_array: 'azrt_arr',
            subject: '${upstream_cookie__azrt}'
          }
        },
        {
          name: 'set_cookie',
          argument: '_azrt=%{azrt_arr[0]}; Max-Age=1209600; Path=/; SameSite=Lax; Secure'
        },
        { name: 'filter_response_cookie', argument: '_azrt' }
      ],
      criteria: [
        [
          {
            argument: '.*',
            variable: '${upstream_cookie__azrt}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 16,
      description:
        'Captures and rewrites the _azrt cookie from upstream responses, setting it with specific domain, path, and security settings.'
    },
    {
      id: 315396,
      name: 'Rewrite azsid Cookie',
      phase: { content: 'Response', outlined: true, severity: 'info' },
      behaviors: [
        {
          name: 'capture_match_groups',
          argument: {
            regex: '(.*)',
            captured_array: 'azsid_arr',
            subject: '${upstream_cookie_azsid}'
          }
        },
        {
          name: 'set_cookie',
          argument:
            'azsid=%{azsid_arr[0]}; Max-Age=1209600; Path=/; SameSite=Lax; Secure; Domain=azionedge.net'
        },
        { name: 'filter_response_cookie', argument: 'azsid' }
      ],
      criteria: [
        [
          {
            argument: '.*',
            variable: '${upstream_cookie_azsid}',
            conditional: 'if',
            operator: 'matches'
          }
        ]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 17,
      description:
        'Captures and rewrites the azsid cookie from upstream responses, applying new domain, expiration, and secure attributes.'
    },
    {
      id: 315398,
      name: 'Secure Headers',
      phase: { content: 'Response', outlined: true, severity: 'info' },
      behaviors: [
        { name: 'add_response_header', argument: 'X-Frame-Options: SAMEORIGIN' },
        { name: 'add_response_header', argument: 'X-Content-Type-Options: nosniff' },
        {
          name: 'add_response_header',
          argument: 'Strict-Transport-Security: max-age=2592000; includeSubDomains'
        },
        {
          name: 'add_response_header',
          argument: 'Referrer-Policy: strict-origin-when-cross-origin'
        },
        { name: 'add_response_header', argument: 'X-XSS-Protection: 1; mode=block' },
        { name: 'add_response_header', argument: 'Cross-Origin-Opener-Policy: unsafe-none' }
      ],
      criteria: [
        [{ argument: '^\\/', variable: '${uri}', conditional: 'if', operator: 'matches' }]
      ],
      status: { content: 'Active', severity: 'success' },
      order: 18,
      description:
        'Sets various security headers to enhance the security posture of responses, including protections against clickjacking, XSS, and other web vulnerabilities.'
    }
  ])

  const expandedRowGroups = ref([])
  const onRowReorder = (event) => {
    customers.value = event.value
  }

  const onRowGroupExpand = (event) => {
    console.log(event)
  }
  const onRowGroupCollapse = (event) => {
    console.log(event)
  }

  const getSeverity = (status) => {
    switch (status) {
      case 'unqualified':
        return 'danger'

      case 'qualified':
        return 'success'

      case 'new':
        return 'info'

      case 'negotiation':
        return 'warning'

      case 'renewal':
        return null
    }
  }
</script>
