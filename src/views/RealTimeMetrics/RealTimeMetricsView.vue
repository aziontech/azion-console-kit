<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Real-Time Metrics"
        data-testid="real-time-metrics__page-heading-block__title"
      />
    </template>
    <template
      #content
      v-if="showContent"
    >
      <TabsPageBlock
        :key="groupData.current?.id"
        :moduleActions="metricsModule.actions"
        :moduleGetters="metricsModule.getters"
        :groupData="groupData"
        :userUTC="userUTC"
      />
      <!-- Sistema de Filtros Avançados -->
      <div class="mb-6">
        <AdvancedFilterSystem
          v-model="advancedFilterState"
          :fieldsFilter="AVAILABLE_FILTERS"
        />
      </div>

      <div
        class="card surface-border border rounded-md surface-section p-3.5 flex flex-col gap-6 md:gap-4"
      >
        <IntervalFilterBlock
          :key="filterData.current?.id"
          :moduleActions="metricsModule.actions"
          :moduleGetters="metricsModule.getters"
          :filterData="filterData"
          :userUTC="userUTC"
          @applyTSRange="load"
          :groupData="groupData"
        />
        <ContentFilterBlock
          :key="filterData.current?.id"
          :playgroundOpener="playgroundOpener"
          :moduleActions="metricsModule.actions"
          :moduleGetters="metricsModule.getters"
          :filterData="filterData"
          :groupData="groupData"
          :userUTC="userUTC"
          :filterHash="filterHash"
          @clearHash="clearFilterHash"
        />
      </div>
      <DashboardPanelBlock
        v-if="reportData"
        :key="groupData.currentDashboard?.id"
        :clipboardWrite="clipboardWrite"
        :moduleActions="metricsModule.actions"
        :moduleGetters="metricsModule.getters"
        :reportData="reportData"
        :groupData="groupData"
        :userUTC="userUTC"
      />
    </template>
  </ContentBlock>
</template>

<script setup>
  import { useAccountStore } from '@/stores/account'
  import RealTimeMetricsModule from '@/modules/real-time-metrics'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import { computed, onMounted, onUnmounted, ref, watch, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import ContentFilterBlock from './blocks/content-filter-block.vue'
  import DashboardPanelBlock from './blocks/dashboard-panel-block.vue'
  import IntervalFilterBlock from './blocks/interval-filter-block.vue'
  import TabsPageBlock from './blocks/tabs-page-block'
  import AdvancedFilterSystem from '@/templates/advanced-filter-system/index.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const AVAILABLE_FILTERS = [
    {
      label: 'Domain',
      value: 'configurationId',
      mostRelevant: 0,
      description: 'Unique Azion configuration identifier set on virtual host configuration file.',
      operator: [
        {
          value: 'In',
          type: 'ArrayObjectDomain',
          props: {}
        }
      ]
    },
    {
      label: 'Status',
      value: 'status',
      mostRelevant: 1,
      description: 'HTTP status code of the request.',
      operator: [
        {
          value: 'Eq',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Lte',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Gte',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Range',
          type: 'IntRange',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        }
      ]
    },
    {
      label: 'Upstream Status',
      value: 'upstreamStatus',
      mostRelevant: 2,
      description:
        "HTTP status code of the origin. If a server can't be selected, the variable keeps the 502 (Bad Gateway) status code.",
      operator: [
        {
          value: 'Eq',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Lte',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Gte',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'Int',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        },
        {
          value: 'Range',
          type: 'IntRange',
          props: {
            placeholder: 'Example: 200',
            services: []
          }
        }
      ]
    },
    {
      label: 'Upstream Cache Status',
      value: 'upstreamCacheStatus',
      mostRelevant: 3,
      description: 'Status of the local edge cache.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: MISS',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: MISS',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: MISS',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: MISS',
            services: []
          }
        }
      ]
    },
    {
      label: 'Request Time',
      value: 'requestTime',
      mostRelevant: 4,
      description:
        'Request processing time elapsed since the first bytes were read from the client with resolution in milliseconds.',
      operator: [
        {
          value: 'Eq',
          type: 'Float',
          props: {
            placeholder: 'Example: 1.19',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'Float',
          props: {
            placeholder: 'Example: 1.19',
            services: []
          }
        },
        {
          value: 'Lte',
          type: 'Float',
          props: {
            placeholder: 'Example: 1.19',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'Float',
          props: {
            placeholder: 'Example: 1.19',
            services: []
          }
        },
        {
          value: 'Gte',
          type: 'Float',
          props: {
            placeholder: 'Example: 1.19',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'Float',
          props: {
            placeholder: 'Example: 1.19',
            services: []
          }
        },
        {
          value: 'Range',
          type: 'FloatRange',
          props: {
            placeholder: 'Example: 1.19',
            services: []
          }
        }
      ]
    },
    {
      label: 'Bandwidth Images Processed Saved Data',
      value: 'bandwidthImagesProcessedSavedData',
      mostRelevant: -1,
      description:
        'The saved data bandwidth achieved with Images Processor through Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 40.55',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 40.55',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 40.55',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 40.55',
            services: []
          }
        }
      ]
    },
    {
      label: 'Bandwidth Missed Data',
      value: 'bandwidthMissedData',
      mostRelevant: -1,
      description: 'The missed data bandwidth rate achieved through Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3.76',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3.76',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3.76',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3.76',
            services: []
          }
        }
      ]
    },
    {
      label: 'Bandwidth Offload',
      value: 'bandwidthOffload',
      mostRelevant: -1,
      description: 'Percentage of the bandwidth that was offloaded through Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85.23',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85.23',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85.23',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85.23',
            services: []
          }
        }
      ]
    },
    {
      label: 'Bandwidth Saved Data',
      value: 'bandwidthSavedData',
      mostRelevant: -1,
      description: 'The saved data bandwidth rate achieved through Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.21',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.21',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.21',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.21',
            services: []
          }
        }
      ]
    },
    {
      label: 'Bandwidth Total',
      value: 'bandwidthTotal',
      mostRelevant: -1,
      description: 'The bandwidth rate achieved through Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 4.21',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 4.21',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 4.21',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 4.21',
            services: []
          }
        }
      ]
    },
    {
      label: 'Bytes Sent',
      value: 'bytesSent',
      mostRelevant: -1,
      description: 'Number of bytes sent to a client.',
      operator: [
        {
          value: 'Eq',
          type: 'Float',
          props: {
            placeholder: 'Example: 191',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'Float',
          props: {
            placeholder: 'Example: 191',
            services: []
          }
        },
        {
          value: 'Lte',
          type: 'Float',
          props: {
            placeholder: 'Example: 191',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'Float',
          props: {
            placeholder: 'Example: 191',
            services: []
          }
        },
        {
          value: 'Gte',
          type: 'Float',
          props: {
            placeholder: 'Example: 191',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'Float',
          props: {
            placeholder: 'Example: 191',
            services: []
          }
        },
        {
          value: 'Range',
          type: 'FloatRange',
          props: {
            placeholder: 'Example: 191',
            services: []
          }
        }
      ]
    },
    {
      label: 'Configuration Id',
      value: 'configurationId',
      mostRelevant: -1,
      description: 'Unique Azion configuration identifier set on virtual host configuration file.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            services: []
          }
        }
      ]
    },
    {
      label: 'Data Transferred In',
      value: 'dataTransferredIn',
      mostRelevant: -1,
      description:
        "Sum of the request length. If the data wasn't a cache hit, the request length is summed once more.",
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 1202',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 1202',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 1202',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 1202',
            services: []
          }
        }
      ]
    },
    {
      label: 'Data Transferred Out',
      value: 'dataTransferredOut',
      mostRelevant: -1,
      description:
        "Sum of the bytes sent. If the data wasn't a cache hit, the upstream bytes sent is summed.",
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6460',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6460',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6460',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6460',
            services: []
          }
        }
      ]
    },
    {
      label: 'Data Transferred Total',
      value: 'dataTransferredTotal',
      mostRelevant: -1,
      description: 'Value of Data Transferred In + Data Transferred Out.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 766',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 766',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 766',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 766',
            services: []
          }
        }
      ]
    },
    {
      label: 'Edge Requests Total',
      value: 'edgeRequestsTotal',
      mostRelevant: -1,
      description: 'Total amount of all requests in the edge application.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 23',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 23',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 23',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 23',
            services: []
          }
        }
      ]
    },
    {
      label: 'Edge Requests Total Per Second',
      value: 'edgeRequestsTotalPerSecond',
      mostRelevant: -1,
      description: 'Total amount of requests per second in the edge application.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00026',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00026',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00026',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00026',
            services: []
          }
        }
      ]
    },
    {
      label: 'Geoloc Country Name',
      value: 'geolocCountryName',
      mostRelevant: -1,
      description: 'Country name resolution based on client IP.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: Canada',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: Canada',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: Canada',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: Canada',
            services: []
          }
        }
      ]
    },
    {
      label: 'Geoloc Region Name',
      value: 'geolocRegionName',
      mostRelevant: -1,
      description: 'Region/state name resolution based on client IP.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: Parana',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: Parana',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: Parana',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: Parana',
            services: []
          }
        }
      ]
    },
    {
      label: 'Host',
      value: 'host',
      mostRelevant: -1,
      description:
        'Host information sent on the request line. Stores: host name from the request line, or host name from the “Host” request header field, or the server name matching a request.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: g1sdetynmxe0ao.map.azionedge.net',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: g1sdetynmxe0ao.map.azionedge.net',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: g1sdetynmxe0ao.map.azionedge.net',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: g1sdetynmxe0ao.map.azionedge.net',
            services: []
          }
        }
      ]
    },
    {
      label: 'Http Requests Total',
      value: 'httpRequestsTotal',
      mostRelevant: -1,
      description: 'Total amount of requests using the HTTP protocol.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        }
      ]
    },
    {
      label: 'Https Requests Total',
      value: 'httpsRequestsTotal',
      mostRelevant: -1,
      description: 'Total amount of requests using the HTTPS protocol.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 120',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 120',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 120',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 120',
            services: []
          }
        }
      ]
    },
    {
      label: 'Missed Data',
      value: 'missedData',
      mostRelevant: -1,
      description: 'Amount of data that was missing and fetched from the origin.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 384',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 384',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 384',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 384',
            services: []
          }
        }
      ]
    },
    {
      label: 'Missed Requests',
      value: 'missedRequests',
      mostRelevant: -1,
      description: 'Amount of requests missed by using Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        }
      ]
    },
    {
      label: 'Missed Requests Per Second',
      value: 'missedRequestsPerSecond',
      mostRelevant: -1,
      description: 'Amount of requests missed per second by using Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00034',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00034',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00034',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00034',
            services: []
          }
        }
      ]
    },
    {
      label: 'Offload',
      value: 'offload',
      mostRelevant: -1,
      description: 'Percentage of client data delivered by Azion, saving data.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 9.71',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 9.71',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 9.71',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 9.71',
            services: []
          }
        }
      ]
    },
    {
      label: 'Proxy Status',
      value: 'proxyStatus',
      mostRelevant: -1,
      description:
        'HTTP error status code or origin when no response is obtained from the upstream.',
      operator: [
        {
          value: 'Eq',
          type: 'Int',
          props: {
            placeholder: 'Example: 500',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'Int',
          props: {
            placeholder: 'Example: 500',
            services: []
          }
        },
        {
          value: 'Lte',
          type: 'Int',
          props: {
            placeholder: 'Example: 500',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'Int',
          props: {
            placeholder: 'Example: 500',
            services: []
          }
        },
        {
          value: 'Gte',
          type: 'Int',
          props: {
            placeholder: 'Example: 500',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'Int',
          props: {
            placeholder: 'Example: 500',
            services: []
          }
        },
        {
          value: 'Range',
          type: 'IntRange',
          props: {
            placeholder: 'Example: 500',
            services: []
          }
        }
      ]
    },
    {
      label: 'Remote Address Class',
      value: 'remoteAddressClass',
      mostRelevant: -1,
      description: 'Class of the IP address of the origin that generated the request.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: 44.192.0.0/11',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: 44.192.0.0/11',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: 44.192.0.0/11',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: 44.192.0.0/11',
            services: []
          }
        }
      ]
    },
    {
      label: 'Request Length',
      value: 'requestLength',
      mostRelevant: -1,
      description: 'Request length, including request line, headers, and body.',
      operator: [
        {
          value: 'Eq',
          type: 'Float',
          props: {
            placeholder: 'Example: 167',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'Float',
          props: {
            placeholder: 'Example: 167',
            services: []
          }
        },
        {
          value: 'Lte',
          type: 'Float',
          props: {
            placeholder: 'Example: 167',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'Float',
          props: {
            placeholder: 'Example: 167',
            services: []
          }
        },
        {
          value: 'Gte',
          type: 'Float',
          props: {
            placeholder: 'Example: 167',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'Float',
          props: {
            placeholder: 'Example: 167',
            services: []
          }
        },
        {
          value: 'Range',
          type: 'FloatRange',
          props: {
            placeholder: 'Example: 167',
            services: []
          }
        }
      ]
    },
    {
      label: 'Request Method',
      value: 'requestMethod',
      mostRelevant: -1,
      description: 'HTTP request method.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: GET',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: GET',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: GET',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: GET',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests',
      value: 'requests',
      mostRelevant: -1,
      description: 'Amount of requests in the aggregation being used.',
      operator: [
        {
          value: 'Eq',
          type: 'Float',
          props: {
            placeholder: 'Example: 11',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'Float',
          props: {
            placeholder: 'Example: 11',
            services: []
          }
        },
        {
          value: 'Lte',
          type: 'Float',
          props: {
            placeholder: 'Example: 11',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'Float',
          props: {
            placeholder: 'Example: 11',
            services: []
          }
        },
        {
          value: 'Gte',
          type: 'Float',
          props: {
            placeholder: 'Example: 11',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'Float',
          props: {
            placeholder: 'Example: 11',
            services: []
          }
        },
        {
          value: 'Range',
          type: 'FloatRange',
          props: {
            placeholder: 'Example: 11',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Http Method Get',
      value: 'requestsHttpMethodGet',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP method GET.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Http Method Head',
      value: 'requestsHttpMethodHead',
      mostRelevant: -1,
      description: 'Total amount of requests with HTTP method HEAD.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 2',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 2',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 2',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 2',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Http Method Others',
      value: 'requestsHttpMethodOthers',
      mostRelevant: -1,
      description: 'Total amount of requests with others HTTP methods.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Http Method Post',
      value: 'requestsHttpMethodPost',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP method POST.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Offloaded',
      value: 'requestsOffloaded',
      mostRelevant: -1,
      description: 'Percentage of client requests delivered by Azion.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 50',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 50',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 50',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 50',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Per Second Offloaded',
      value: 'requestsPerSecondOffloaded',
      mostRelevant: -1,
      description:
        'Percentage of the requests per second that were offloaded through Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85.23',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85.23',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85.23',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85.23',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code200',
      value: 'requestsStatusCode200',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 200 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 85',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code204',
      value: 'requestsStatusCode204',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 204 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 766',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 766',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 766',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 766',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code206',
      value: 'requestsStatusCode206',
      mostRelevant: -1,
      description: 'Amount of requests with status code 206.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 20',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 20',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 20',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 20',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code2xx',
      value: 'requestsStatusCode2xx',
      mostRelevant: -1,
      description: 'Total amount of requests with other 2XX HTTP status codes.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 60',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 60',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 60',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 60',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code301',
      value: 'requestsStatusCode301',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 301 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code302',
      value: 'requestsStatusCode302',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 302 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 12',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 12',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 12',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 12',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code304',
      value: 'requestsStatusCode304',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 304 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code3xx',
      value: 'requestsStatusCode3xx',
      mostRelevant: -1,
      description: 'Total amount of requests with other 3XX HTTP status codes.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 30',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 30',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 30',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 30',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code400',
      value: 'requestsStatusCode400',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 400 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 24',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 24',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 24',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 24',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code403',
      value: 'requestsStatusCode403',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 403 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 14',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 14',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 14',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 14',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code404',
      value: 'requestsStatusCode404',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 404 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 35',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 35',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 35',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 35',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code4xx',
      value: 'requestsStatusCode4xx',
      mostRelevant: -1,
      description: 'Total amount of requests with other 4XX HTTP status codes.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 50',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 50',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 50',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 50',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code500',
      value: 'requestsStatusCode500',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 500 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 6',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code502',
      value: 'requestsStatusCode502',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 502 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code503',
      value: 'requestsStatusCode503',
      mostRelevant: -1,
      description: 'Total amount of requests with the HTTP 503 status code.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 40',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 40',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 40',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 40',
            services: []
          }
        }
      ]
    },
    {
      label: 'Requests Status Code5xx',
      value: 'requestsStatusCode5xx',
      mostRelevant: -1,
      description: 'Total amount of requests with other 5XX HTTP status codes.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 100',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 100',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 100',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 100',
            services: []
          }
        }
      ]
    },
    {
      label: 'Saved Data',
      value: 'savedData',
      mostRelevant: -1,
      description: 'Amount of data that was saved by using Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 8300',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 8300',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 8300',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 8300',
            services: []
          }
        }
      ]
    },
    {
      label: 'Saved Requests',
      value: 'savedRequests',
      mostRelevant: -1,
      description: 'Amount of requests saved by using Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 18',
            services: []
          }
        }
      ]
    },
    {
      label: 'Saved Requests Per Second',
      value: 'savedRequestsPerSecond',
      mostRelevant: -1,
      description: 'Amount of requests saved per second by using Azion services.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00065',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00065',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00065',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 0.00065',
            services: []
          }
        }
      ]
    },
    {
      label: 'Scheme',
      value: 'scheme',
      mostRelevant: -1,
      description: 'Request scheme.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: HTTPS',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: HTTPS',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: HTTPS',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: HTTPS',
            services: []
          }
        }
      ]
    },
    {
      label: 'Sent Http X Original Image Size',
      value: 'sentHttpXOriginalImageSize',
      mostRelevant: -1,
      description:
        "“X-Original-Image-Size” header sent in the origin's response. Used by IMS to inform original image size.",
      operator: [
        {
          value: 'Eq',
          type: 'Float',
          props: {
            placeholder: 'Example: 987390',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'Float',
          props: {
            placeholder: 'Example: 987390',
            services: []
          }
        },
        {
          value: 'Lte',
          type: 'Float',
          props: {
            placeholder: 'Example: 987390',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'Float',
          props: {
            placeholder: 'Example: 987390',
            services: []
          }
        },
        {
          value: 'Gte',
          type: 'Float',
          props: {
            placeholder: 'Example: 987390',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'Float',
          props: {
            placeholder: 'Example: 987390',
            services: []
          }
        },
        {
          value: 'Range',
          type: 'FloatRange',
          props: {
            placeholder: 'Example: 987390',
            services: []
          }
        }
      ]
    },
    {
      label: 'Server Protocol',
      value: 'serverProtocol',
      mostRelevant: -1,
      description: 'Protocol version of the request.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: HTTP/1.1',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: HTTP/1.1',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: HTTP/1.1',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: HTTP/1.1',
            services: []
          }
        }
      ]
    },
    {
      label: 'Source Loc Pop',
      value: 'sourceLocPop',
      mostRelevant: -1,
      description: 'Location and PoP of the edge that received the request.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: lax-bso',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: lax-bso',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: lax-bso',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: lax-bso',
            services: []
          }
        }
      ]
    },
    {
      label: 'Ssl Protocol',
      value: 'sslProtocol',
      mostRelevant: -1,
      description: 'SSL/TLS protocol version of the request.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: TLSv1.2',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: TLSv1.2',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: TLSv1.2',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: TLSv1.2',
            services: []
          }
        }
      ]
    },
    {
      label: 'Upstream Bytes Received',
      value: 'upstreamBytesReceived',
      mostRelevant: -1,
      description: "Number of bytes received by the origin's edge if the content isn't cached.",
      operator: [
        {
          value: 'Eq',
          type: 'Float',
          props: {
            placeholder: 'Example: 8304',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'Float',
          props: {
            placeholder: 'Example: 8304',
            services: []
          }
        },
        {
          value: 'Lte',
          type: 'Float',
          props: {
            placeholder: 'Example: 8304',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'Float',
          props: {
            placeholder: 'Example: 8304',
            services: []
          }
        },
        {
          value: 'Gte',
          type: 'Float',
          props: {
            placeholder: 'Example: 8304',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'Float',
          props: {
            placeholder: 'Example: 8304',
            services: []
          }
        },
        {
          value: 'Range',
          type: 'FloatRange',
          props: {
            placeholder: 'Example: 8304',
            services: []
          }
        }
      ]
    },
    {
      label: 'Upstream Response Time',
      value: 'upstreamResponseTime',
      mostRelevant: -1,
      description:
        'Time it takes for the edge to receive a default response from the origin in milliseconds, including headers and body.',
      operator: [
        {
          value: 'Eq',
          type: 'Float',
          props: {
            placeholder: 'Example: 0.876',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'Float',
          props: {
            placeholder: 'Example: 0.876',
            services: []
          }
        },
        {
          value: 'Lte',
          type: 'Float',
          props: {
            placeholder: 'Example: 0.876',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'Float',
          props: {
            placeholder: 'Example: 0.876',
            services: []
          }
        },
        {
          value: 'Gte',
          type: 'Float',
          props: {
            placeholder: 'Example: 0.876',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'Float',
          props: {
            placeholder: 'Example: 0.876',
            services: []
          }
        },
        {
          value: 'Range',
          type: 'FloatRange',
          props: {
            placeholder: 'Example: 0.876',
            services: []
          }
        }
      ]
    },
    {
      label: 'Waf Attack Family',
      value: 'wafAttackFamily',
      mostRelevant: -1,
      description: 'WAF attack family.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: XSS',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: XSS',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: XSS',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: XSS',
            services: []
          }
        }
      ]
    },
    {
      label: 'Waf Block',
      value: 'wafBlock',
      mostRelevant: -1,
      description:
        "Informs whether the WAF blocked the action or not. 0 when action wasn't blocked and 1 when action was blocked. When in Learning Mode, it won't be blocked regardless of the return.",
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: 0',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: 0',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: 0',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: 0',
            services: []
          }
        }
      ]
    },
    {
      label: 'Waf Learning',
      value: 'wafLearning',
      mostRelevant: -1,
      description: 'Informs if WAF is in Learning mode.',
      operator: [
        {
          value: 'Eq',
          type: 'String',
          props: {
            placeholder: 'Example: 1',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'String',
          props: {
            placeholder: 'Example: 1',
            services: []
          }
        },
        {
          value: 'Like',
          type: 'String',
          props: {
            placeholder: 'Example: 1',
            services: []
          }
        },
        {
          value: 'Ilike',
          type: 'String',
          props: {
            placeholder: 'Example: 1',
            services: []
          }
        }
      ]
    },
    {
      label: 'Waf Requests Allowed',
      value: 'wafRequestsAllowed',
      mostRelevant: -1,
      description: 'Total amount of requests allowed by WAF.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        }
      ]
    },
    {
      label: 'Waf Requests Blocked',
      value: 'wafRequestsBlocked',
      mostRelevant: -1,
      description: 'Total amount of requests blocked by WAF.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 4',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 4',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 4',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 4',
            services: []
          }
        }
      ]
    },
    {
      label: 'Waf Requests Others Attacks',
      value: 'wafRequestsOthersAttacks',
      mostRelevant: -1,
      description:
        'Total amount of requests with Others attacks, not considering XSS, RFI, and SQL Injection threats.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 2',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 2',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 2',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 2',
            services: []
          }
        }
      ]
    },
    {
      label: 'Waf Requests Rfi Attacks',
      value: 'wafRequestsRfiAttacks',
      mostRelevant: -1,
      description: 'Total amount of requests with Remote File Inclusion (RFI) attack.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 5',
            services: []
          }
        }
      ]
    },
    {
      label: 'Waf Requests Sql Attacks',
      value: 'wafRequestsSqlAttacks',
      mostRelevant: -1,
      description: 'Total amount of requests with SQL Injection attack.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 3',
            services: []
          }
        }
      ]
    },
    {
      label: 'Waf Requests Threat',
      value: 'wafRequestsThreat',
      mostRelevant: -1,
      description: 'Total amount of threatened requests handled by WAF.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 10',
            services: []
          }
        }
      ]
    },
    {
      label: 'Waf Requests Xss Attacks',
      value: 'wafRequestsXssAttacks',
      mostRelevant: -1,
      description: 'Total amount of requests with Cross-site scripting (XSS) attack.',
      operator: [
        {
          value: 'Eq',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 1',
            services: []
          }
        },
        {
          value: 'Ne',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 1',
            services: []
          }
        },
        {
          value: 'Gt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 1',
            services: []
          }
        },
        {
          value: 'Lt',
          type: 'GenericScalar',
          props: {
            placeholder: 'Example: 1',
            services: []
          }
        }
      ]
    }
  ]

  defineProps({
    playgroundOpener: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    }
  })

  const route = useRoute()
  const filterHash = ref(null)

  onMounted(() => {
    loadPageInfo()
    setFilterHash()
  })

  const setFilterHash = () => {
    filterHash.value = route?.query?.filters || ''
  }

  const clearFilterHash = () => {
    filterHash.value = ''
  }

  const accountStore = useAccountStore()
  const userUTC = accountStore.accountUtcOffset

  const metricsModule = RealTimeMetricsModule
  const {
    getters: { currentIdPageAndDashboard, getCurrentInfo },
    actions: {
      setInitialPageAndDashboardCurrent,
      setInfoAvailableFilters,
      setInitialCurrentsByIds,
      setDatasetAvailableFilters,
      loadCurrentReports
    },
    groupObservable,
    filterObservable,
    reportObservable
  } = metricsModule

  /* Module state */

  const groupData = ref(null)
  const filterData = ref(null)
  const reportData = ref(null)

  /* Advanced Filter System state */
  const advancedFilterState = ref({
    searchQuery: {},
    dateRange: null,
    filters: []
  })

  const updateGroupData = (data) => {
    groupData.value = { ...data }
  }
  groupObservable.subscribe(updateGroupData)

  const updateFilterData = (data) => {
    filterData.value = { ...data }
  }
  filterObservable.subscribe(updateFilterData)

  const updateReportData = (data) => {
    reportData.value = { ...data }
  }
  reportObservable.subscribe(updateReportData)

  const showContent = computed(() => {
    return groupData.value && filterData.value
  })

  const getCurrentIds = computed(() => {
    return currentIdPageAndDashboard({ group: groupData.value })
  })

  const loadPageInfo = async () => {
    setCurrentPageAndDashboard()
    await setInfoAvailableFilters()
    await setDatasetAvailableFilters()
    updateRouter()
  }

  const load = async () => {
    await loadCurrentReports(userUTC)
  }

  const setCurrentPageAndDashboard = () => {
    const { pageId, dashboardId } = route.params

    if (!pageId || !dashboardId) {
      return setInitialPageAndDashboardCurrent()
    }

    return setInitialCurrentsByIds({ pageId, dashboardId })
  }

  const router = useRouter()

  const updateRouter = () => {
    const { query } = route

    router.push({
      name: 'real-time-metrics',
      params: getCurrentIds.value,
      query
    })
  }

  const clickedToRealTimeMetrics = ({ eventName, payload }) => {
    tracker.realTimeMetrics
      .clickedToRealTimeMetrics({
        eventName,
        payload
      })
      .track()
  }

  const currentInfo = computed(() => {
    if (!groupData.value) return
    return getCurrentInfo({ group: groupData.value })
  })

  watch(currentInfo, () => {
    const eventName = 'Clicked to View Real-Time Metrics'
    const payload = {
      section: currentInfo.value.Group,
      page: currentInfo.value.Page
    }
    clickedToRealTimeMetrics({ eventName, payload })
    setTimeout(() => {
      updateRouter()
    }, 100)
  })

  watch(advancedFilterState, () => {
    // eslint-disable-next-line no-console
    console.log('advancedFilterState', advancedFilterState.value)
  }, { deep: true })

  onUnmounted(() => {
    groupObservable.unsubscribe(updateGroupData)
    filterObservable.unsubscribe(updateFilterData)
    reportObservable.unsubscribe(updateReportData)
  })
</script>
