import { formatUnitValue } from '@/helpers'
import { AxiosHttpClientAdapter, parseHttpResponse } from '../axios/AxiosHttpClientAdapter'
import { makeAccountingBaseUrl } from './make-accounting-base-url'
const BOT_MANAGER_SLUG = 'bot_manager'
const EDGE_STORAGE_SLUG = 'edge_storage'

const MOCK = {
  data: {
    accountingDetail: [
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 1641.663001253,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'application_accelerator',
        metricSlug: 'application_accelerator_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 147.468297129,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'application_accelerator',
        metricSlug: 'application_accelerator_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 2.270529331,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'application_accelerator',
        metricSlug: 'application_accelerator_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 8639.353615335,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'application_accelerator',
        metricSlug: 'application_accelerator_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'application_accelerator',
        metricSlug: 'application_accelerator_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 16582.565985289,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'application_accelerator',
        metricSlug: 'application_accelerator_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'bot_manager',
        metricSlug: 'bot_manager_invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'bot_manager',
        metricSlug: 'bot_manager_invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'bot_manager',
        metricSlug: 'bot_manager_invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'bot_manager',
        metricSlug: 'bot_manager_invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'bot_manager',
        metricSlug: 'bot_manager_invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'bot_manager',
        metricSlug: 'bot_manager_invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 375837912.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'edge_application',
        metricSlug: 'requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'edge_application',
        metricSlug: 'requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 2297062888.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'edge_application',
        metricSlug: 'requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 464190.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'edge_application',
        metricSlug: 'requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 6527561.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'edge_application',
        metricSlug: 'requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 41982225.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'edge_application',
        metricSlug: 'requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 87033.98553042,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'edge_application',
        metricSlug: 'data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 3004.518263532,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'edge_application',
        metricSlug: 'data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 496.751899988,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'edge_application',
        metricSlug: 'data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 8.653209557,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'edge_application',
        metricSlug: 'data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'edge_application',
        metricSlug: 'data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 24741.037817552,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'edge_application',
        metricSlug: 'data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'data_stream',
        metricSlug: 'data_stream_data_streamed'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'data_stream',
        metricSlug: 'data_stream_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'ddos_protection_20gbps',
        metricSlug: 'ddos_protection_20gbps'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'ddos_protection_50gbps',
        metricSlug: 'ddos_protection_50gbps'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'ddos_protection_data_transferred',
        metricSlug: 'ddos_protection_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'ddos_protection_data_transferred',
        metricSlug: 'ddos_protection_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'ddos_protection_data_transferred',
        metricSlug: 'ddos_protection_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'ddos_protection_data_transferred',
        metricSlug: 'ddos_protection_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'ddos_protection_data_transferred',
        metricSlug: 'ddos_protection_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'ddos_protection_data_transferred',
        metricSlug: 'ddos_protection_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'ddos_protection_unlimited',
        metricSlug: 'ddos_protection_unlimited'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 29603366.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'network_layer_protection',
        metricSlug: 'network_layer_protection_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 4707073.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'network_layer_protection',
        metricSlug: 'network_layer_protection_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 398841.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'network_layer_protection',
        metricSlug: 'network_layer_protection_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 1729071225.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'network_layer_protection',
        metricSlug: 'network_layer_protection_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'network_layer_protection',
        metricSlug: 'network_layer_protection_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 264076617.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'network_layer_protection',
        metricSlug: 'network_layer_protection_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'edge_functions',
        metricSlug: 'compute_time'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'edge_functions',
        metricSlug: 'compute_time'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'edge_functions',
        metricSlug: 'compute_time'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'edge_functions',
        metricSlug: 'compute_time'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'edge_functions',
        metricSlug: 'compute_time'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'edge_functions',
        metricSlug: 'compute_time'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'edge_functions',
        metricSlug: 'invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'edge_functions',
        metricSlug: 'invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'edge_functions',
        metricSlug: 'invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'edge_functions',
        metricSlug: 'invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'edge_functions',
        metricSlug: 'invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'edge_functions',
        metricSlug: 'invocations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'edge_storage',
        metricSlug: 'edge_storage_class_a_operations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'edge_storage',
        metricSlug: 'edge_storage_class_b_operations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'edge_storage',
        metricSlug: 'edge_storage_class_c_operations'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'edge_storage',
        metricSlug: 'edge_storage_data_stored'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 529124.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'image_processor',
        metricSlug: 'images_processed'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 10501529.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'image_processor',
        metricSlug: 'images_processed'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'edge_dns',
        metricSlug: 'hosted_zones'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'edge_dns',
        metricSlug: 'edge_dns_queries'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 586.986710944,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'tiered_cache',
        metricSlug: 'tiered_cache_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'tiered_cache',
        metricSlug: 'tiered_cache_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 7154.039689017,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'tiered_cache',
        metricSlug: 'tiered_cache_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'tiered_cache',
        metricSlug: 'tiered_cache_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'tiered_cache',
        metricSlug: 'tiered_cache_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'tiered_cache',
        metricSlug: 'tiered_cache_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'live_ingest',
        metricSlug: 'data_ingested'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'live_ingest',
        metricSlug: 'data_ingested'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'load_balancer',
        metricSlug: 'load_balancer_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'load_balancer',
        metricSlug: 'load_balancer_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'load_balancer',
        metricSlug: 'load_balancer_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'load_balancer',
        metricSlug: 'load_balancer_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'load_balancer',
        metricSlug: 'load_balancer_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'load_balancer',
        metricSlug: 'load_balancer_data_transferred'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 31.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'plan_business',
        metricSlug: 'plan_business'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'plan_enterprise',
        metricSlug: 'plan_enterprise'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'plan_missioncritical',
        metricSlug: 'plan_missioncritical'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'support_enterprise',
        metricSlug: 'support_enterprise'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'No Region',
        productSlug: 'support_mission_critical',
        metricSlug: 'support_mission_critical'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Latam',
        productSlug: 'waf',
        metricSlug: 'waf_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Europe',
        productSlug: 'waf',
        metricSlug: 'waf_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'All Other Regions',
        productSlug: 'waf',
        metricSlug: 'waf_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Brazil',
        productSlug: 'waf',
        metricSlug: 'waf_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'Canada',
        productSlug: 'waf',
        metricSlug: 'waf_requests'
      },
      {
        billId: 11907625,
        periodTo: '2025-01-31',
        accounted: 0.0,
        invoiceNumber: '*--*-9028l012025',
        regionName: 'United States',
        productSlug: 'waf',
        metricSlug: 'waf_requests'
      }
    ]
  }
}

export const listServiceAndProductsChangesAccountingService = async (billID) => {
  const BILL_DETAIL_QUERY = `
    query details {
      accountingDetail (
        limit: 10000,
        filter: {
          billId: ${billID}
        },
        orderBy: [productSlug_ASC, metricSlug_ASC]
      ) {
        billId,
        periodTo,
        accounted,
        invoiceNumber,
        regionName,
        productSlug,
        metricSlug,
      }
    }`

  const graphQLPayload = {
    query: BILL_DETAIL_QUERY
  }

  let httpResponse = await AxiosHttpClientAdapter.request({
    baseURL: '/',
    url: `${makeAccountingBaseUrl()}`,
    method: 'POST',
    body: graphQLPayload
  })

  httpResponse = adapt({ body: {}, ...httpResponse })

  return parseHttpResponse(httpResponse)
}

const groupBy = (data, groupParams) => {
  const shouldFilter =
    groupParams.length === 2 &&
    groupParams.includes('productSlug') &&
    groupParams.includes('metricSlug')
  const filteredData = shouldFilter ? data.filter((item) => item.accounted) : data

  const groupedMap = filteredData.reduce((groupedData, item) => {
    const key = groupParams.map((param) => item[param]).join('_')
    const valueGroup = groupedData[key] || {}

    const accounted = (valueGroup.accounted || 0) + (item.accounted || 0)
    groupedData[key] = { ...valueGroup, ...item, accounted }

    return groupedData
  }, {})

  return Object.values(groupedMap)
}

const adapt = ({ body, statusCode }) => {
  const { accountingDetail } = body.data

  const productsGrouped = groupBy(accountingDetail, ['productSlug', 'metricSlug'])

  const filteredProducts = productsGrouped.filter(
    (item) => ![BOT_MANAGER_SLUG, EDGE_STORAGE_SLUG].includes(item.productSlug)
  )

  const productsGroupedByRegion = groupBy(accountingDetail, [
    'productSlug',
    'metricSlug',
    'regionName'
  ])

  const adaptedBody = mapProducts(filteredProducts, productsGroupedByRegion)
  const data = joinEdgeApplicationWithTieredCache(adaptedBody)

  return { body: data, statusCode }
}

const PRODUCT_NAMES = {
  edge_application: 'Edge Application',
  application_accelerator: 'Application Accelerator',
  load_balancer: 'Load Balancer',
  image_processor: 'Image Processor',
  edge_functions: 'Edge Functions',
  network_layer_protection: 'Network Layer Protection',
  web_application_firewall: 'Web Application Firewall',
  live_ingest: 'Live Ingest',
  data_stream: 'Data Stream',
  real_time_events: 'Real-Time Events',
  edge_dns: 'Edge DNS',
  ddos_protection_20gbps: 'DDoS Protection 20Gbps',
  ddos_protection_50gbps: 'DDoS Protection 50Gbps',
  ddos_protection_data_transferred: 'DDoS Protection Data Transferred',
  ddos_protection_unlimited: 'DDoS Protection Unlimited',
  plan_business: 'Plan Business',
  plan_enterprise: 'Plan Enterprise',
  plan_missioncritical: 'Plan Mission Critical',
  support_enterprise: 'Support Enterprise',
  support_mission_critical: 'Support Mission Critical',
  waf: 'WAF',
  tiered_cache: 'Tiered Cache'
}

const METRIC_SLUGS = {
  application_accelerator_data_transferred: { title: 'Total Data Transfered', unit: 'GB' },
  requests: { title: 'Total Requests' },
  data_transferred: { title: 'Total Data Transfered', unit: 'GB' },
  data_stream_requests: { title: 'Total Requests' },
  network_layer_protection_requests: { title: 'Total Requests' },
  tiered_cache_data_transferred: { title: 'Total Data Transfered', unit: 'GB' },
  load_balancer_data_transferred: { title: 'Total Data Transfered', unit: 'GB' },
  waf_requests: { title: 'Total Requests' },
  ddos_protection_20gbps: { title: 'DDoS Protection 20Gbps' },
  ddos_protection_50gbps: { title: 'DDoS Protection 50Gbps' },
  ddos_protection_data_transferred: { title: 'Total Data Transfered', unit: 'GB' },
  ddos_protection_unlimited: { title: 'DDoS Protection Unlimited', unit: 'Days' },
  compute_time: { title: 'Compute Time', unit: 'ms' },
  invocations: { title: 'Invocations' },
  images_processed: { title: 'Images Processed' },
  hosted_zones: { title: 'Hosted Zones' },
  edge_dns_queries: { title: 'Standard Queries' },
  data_ingested: { title: 'Data Ingested (GB)', unit: 'GB' },
  plan_business: { title: 'Plan Business' },
  plan_enterprise: { title: 'Plan Enterprise' },
  plan_missioncritical: { title: 'Plan Mission critical' },
  support_enterprise: { title: 'Total Days', unit: 'Days' },
  support_mission_critical: { title: 'Total Days', unit: 'Days' },
  data_stream_data_streamed: { title: 'Data Streamed (GB)', unit: 'GB' }
}

const mapProducts = (productsGrouped, productsGroupedByRegion) => {
  const uniqueProducts = []

  productsGrouped.forEach((product) => {
    const existingProduct = uniqueProducts.find((uProduct) => uProduct.slug === product.productSlug)

    if (existingProduct) {
      existingProduct.descriptions = mapDescriptions(
        product,
        productsGrouped,
        productsGroupedByRegion
      )
    } else {
      uniqueProducts.push({
        service: PRODUCT_NAMES[product.productSlug],
        value: 0,
        slug: product.productSlug,
        currency: 0,
        descriptions: mapDescriptions(product, productsGrouped, productsGroupedByRegion)
      })
    }
  })

  return uniqueProducts
}

const mapDescriptions = (product, productsGrouped, productsGroupedByRegion) => {
  productsGroupedByRegion.sort((regionA, regionB) =>
    regionA.regionName.localeCompare(regionB.regionName)
  )
  return productsGrouped.reduce((list, metric) => {
    if (metric.productSlug === product.productSlug) {
      const unit = METRIC_SLUGS[metric.metricSlug]?.unit
      list.push({
        service: METRIC_SLUGS[metric.metricSlug]?.title,
        slug: metric.metricSlug,
        quantity: formatUnitValue(metric.accounted, unit),
        price: 0,
        data: mapRegionMetrics(metric, productsGroupedByRegion, 0, unit)
      })
    }
    return list
  }, [])
}

const mapRegionMetrics = (metric, productsGroupedByRegion, currency, unit) => {
  return productsGroupedByRegion.reduce((list, regionMetric) => {
    if (
      regionMetric.productSlug === metric.productSlug &&
      regionMetric.metricSlug === metric.metricSlug
    ) {
      list.push({
        country: regionMetric.regionName,
        quantity: formatUnitValue(regionMetric.accounted, unit),
        price: 0,
        slug: regionMetric.metricSlug
      })
    }
    return list
  }, [])
}

const joinEdgeApplicationWithTieredCache = (services) => {
  const edgeApplicationService = services.find((service) => service.slug === 'edge_application')
  const tieredCacheServiceIndex = services.findIndex((service) => service.slug === 'tiered_cache')
  const edgeStorageServiceIndex = services.findIndex((service) => service.slug === 'edge_storage')
  const botManagerServiceIndex = services.findIndex((service) => service.slug === 'bot_manager')

  if (!edgeApplicationService || tieredCacheServiceIndex === -1) return services

  const edgeDataTransferDescription = edgeApplicationService.descriptions.find(
    (desc) => desc.slug === 'data_transferred'
  )

  const tieredCacheService = services[tieredCacheServiceIndex]
  const tieredCacheDataTransferDescription = tieredCacheService.descriptions.find(
    (desc) => desc.slug === 'tiered_cache_data_transferred'
  )

  if (!edgeDataTransferDescription || !tieredCacheDataTransferDescription) return services

  const parseQuantityValue = (qtd) => parseFloat(qtd.replace(/,/g, '').replace(' GB', ''))

  const edgeTotalDataTransfer = parseQuantityValue(edgeDataTransferDescription.quantity)
  const tieredCacheTotalDataTransfer = parseQuantityValue(
    tieredCacheDataTransferDescription.quantity
  )
  const combinedTotalDataTransfer = edgeTotalDataTransfer + tieredCacheTotalDataTransfer

  edgeDataTransferDescription.quantity = formatUnitValue(combinedTotalDataTransfer, 'GB')

  tieredCacheDataTransferDescription.data.forEach((tieredCountryData) => {
    const tieredCountryTransfer = parseQuantityValue(tieredCountryData.quantity)
    const edgeCountryData = edgeDataTransferDescription.data.find(
      (item) => item.country === tieredCountryData.country
    )

    if (edgeCountryData) {
      const edgeQty = parseQuantityValue(edgeCountryData.quantity)
      const newQty = edgeQty + tieredCountryTransfer
      edgeCountryData.quantity = formatUnitValue(newQty, 'GB')
    } else {
      edgeDataTransferDescription.data.push({
        country: tieredCountryData.country,
        quantity: formatUnitValue(tieredCountryTransfer, 'GB'),
        price: tieredCountryData.price,
        slug: 'data_transferred'
      })
    }
  })

  services.splice(tieredCacheServiceIndex, 1)
  services.splice(edgeStorageServiceIndex, 1)
  services.splice(botManagerServiceIndex, 1)

  return services
}
