// Blocks
import LIST_TABLE_BLOCK_SELECTORS from './selectors/block-selectors/list-table-block.js'
import FORM_FIELDS_SELECTORS from './selectors/block-selectors/form-fields-block.js'
import MENU_SIDEBAR_SELECTORS from './selectors/block-selectors/menu-sidebar.js'
import MENU_ACCOUNT_SELECTORS from './selectors/block-selectors/menu-account.js'
import TEAMS_BLOCK_SELECTORS from './selectors/block-selectors/teams-block.js'

// Views
import LOGIN_VIEW_SELECTORS from './selectors/view-selectors/login.js'
import ACTIVITY_HISTORY_VIEW_SELECTORS from './selectors/view-selectors/activity-history.js'
import YOUR_SETTINGS_VIEW_SELECTORS from './selectors/view-selectors/your-settings.js'
import ACCOUNT_SETTINGS_VIEW_SELECTORS from './selectors/view-selectors/account-settings.js'
import USERS_MANAGEMENT_VIEW_SELECTORS from './selectors/view-selectors/users-management.js'

// Products
import EDGE_APPLICATION_PRODUCT_SELECTORS from './selectors/product-selectors/edge-application.js'
import NETWORK_LISTS_PRODUCT_SELECTORS from './selectors/product-selectors/network-lists.js'
import VARIABLES_PRODUCT_SELECTORS from './selectors/product-selectors/variables-product.js'
import WAF_PRODUCT_SELECTORS from './selectors/product-selectors/waf-product.js'
import EDGE_FUNCTIONS_PRODUCT_SELECTORS from './selectors/product-selectors/edge-functions.js'
import EDGE_FIREWALL_PRODUCT_SELECTORS from './selectors/product-selectors/edge-firewall.js'
import EDGE_PULSE_PRODUCT_SELECTORS from './selectors/product-selectors/edge-pulse.js'
import EDGE_SERVICES_PRODUCT_SELECTORS from './selectors/product-selectors/edge-services.js'
import PERSONAL_TOKENS_PRODUCT_SELECTORS from './selectors/product-selectors/personal-tokens.js'
import DATA_STREAM_PRODUCT_SELECTORS from './selectors/product-selectors/data-stream.js'
import EDGE_DNS_PRODUCT_SELECTORS from './selectors/product-selectors/edge-dns.js'
import DOMAINS_PRODUCT_SELECTORS from './selectors/product-selectors/domains.js'
import DIGITAL_CERTIFICATES_PRODUCT_SELECTORS from './selectors/product-selectors/digital-certificates.js'
import EDGE_PURGE_PRODUCT_SELECTORS from './selectors/product-selectors/edge-purge.js'
import BILLING_SELECTORS from './selectors/product-selectors/billing.js'

const selectors = {
  billing: BILLING_SELECTORS,
  list: LIST_TABLE_BLOCK_SELECTORS,
  form: FORM_FIELDS_SELECTORS,
  login: LOGIN_VIEW_SELECTORS,
  menuSidebar: MENU_SIDEBAR_SELECTORS,
  menuAccount: MENU_ACCOUNT_SELECTORS,
  activityHistory: ACTIVITY_HISTORY_VIEW_SELECTORS,
  edgeApplication: EDGE_APPLICATION_PRODUCT_SELECTORS,
  yourSettings: YOUR_SETTINGS_VIEW_SELECTORS,
  networkLists: NETWORK_LISTS_PRODUCT_SELECTORS,
  variables: VARIABLES_PRODUCT_SELECTORS,
  wafs: WAF_PRODUCT_SELECTORS,
  functions: EDGE_FUNCTIONS_PRODUCT_SELECTORS,
  edgeFirewall: EDGE_FIREWALL_PRODUCT_SELECTORS,
  edgePulse: EDGE_PULSE_PRODUCT_SELECTORS,
  edgeServices: EDGE_SERVICES_PRODUCT_SELECTORS,
  personalTokens: PERSONAL_TOKENS_PRODUCT_SELECTORS,
  accountSettings: ACCOUNT_SETTINGS_VIEW_SELECTORS,
  dataStream: DATA_STREAM_PRODUCT_SELECTORS,
  edgeDns: EDGE_DNS_PRODUCT_SELECTORS,
  domains: DOMAINS_PRODUCT_SELECTORS,
  digitalCertificates: DIGITAL_CERTIFICATES_PRODUCT_SELECTORS,
  purge: EDGE_PURGE_PRODUCT_SELECTORS,
  usersManagement: USERS_MANAGEMENT_VIEW_SELECTORS,
  teams: TEAMS_BLOCK_SELECTORS
}

export default selectors
