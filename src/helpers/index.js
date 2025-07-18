import { documentationCatalog, documentationGuideProducts } from './azion-documentation-catalog'
import {
  openAPIDocumentation,
  openContactSupport,
  openDocumentation,
  openGoogleAuthenticatorAppDocumentation,
  openSearchResult,
  openAzionSite,
  openAzionBlog,
  openAzionDiscord,
  openAzionGithub,
  openAzionX,
  openShowMorePlan,
  openMarketplaceIntegrationsDocumentation
} from './azion-documentation-window-opener'
import { azionPrivacyPolicyWindowOpener } from './azion-privacy-policy-opener'
import { azionOnboardingWindowOpener } from './azion-onboarding-window-opener'
import { azionTermsAndServicesWindowOpener } from './azion-terms-and-services-opener'
import { capitalizeFirstLetter } from './capitalize-first-letter'
import { clipboardWrite } from './clipboard'
import { getEnvironment } from './get-environment'
import { getFirstApiError } from './get-first-api-error'
import { getStaticUrlsByEnvironment } from './get-static-urls-by-environment'
import InviteSession from './invite-session'
import { metricsPlaygroundOpener } from './metrics-playground-opener'
import { parseCamelToSnake, parseSnakeToCamel } from './parse-api-body'
import { themeSelect } from './theme-select'
import {
  convertValueToDate,
  convertDateToLocalTimezone,
  formatDateToUS,
  convertValueToDateByUserTimezone,
  formatDateMonthAndYear,
  getRemainingDays,
  getCurrentDateTimeIntl
} from './convert-date'
import { formatCurrencyString, formatUnitValue } from './convert-number'
import { windowOpen } from './window-open'
import { getVulcanPresets } from './get-vulcan-presets'
import { goToClassicInterface } from './go-to-classic-interface'
import { removeHtmlTagFromText } from './remove-html-tag-from-text'
import { getCsvCellContentFromRowData } from './get-csv-cell-content-from-row-data'
import { useRouteFilterManager } from './hash-route.js'
import FILTERS_RULES from './real-time-filters-rules'
import { openGraphQlPlayground } from './open-graphql-playground.js'
import { eventsPlaygroundOpener } from './events-playground-opener'
import { setRedirectRoute, getRedirectRoute } from './login-redirect-manager'
import { disabledBackButton } from './browser-back-button'
import { buildSummary } from './build-summary'
import INFORMATION_TEXTS from './azion-information-texts'
import { getCurrentTimezone } from './account-timezone'
import TEXT_DOMAIN_WORKLOAD from './handle-text-workload-domain-flag'
import { adaptServiceDataResponse } from '../services/v2/utils/adaptServiceDataResponse'
import {
  HTTP_PORT_LIST_OPTIONS,
  HTTP3_PORT_LIST_OPTIONS,
  HTTPS_PORT_LIST_OPTIONS,
  TLS_VERSIONS_OPTIONS,
  SUPPORTED_CIPHERS_LIST_OPTIONS,
  SUPPORTED_VERSIONS
} from './workload-protocol-settings'

const checkIfFieldExist = (field, defaultValue = '-') => field ?? defaultValue
import { getExpiredDate } from './payment-method'

export {
  HTTP_PORT_LIST_OPTIONS,
  HTTP3_PORT_LIST_OPTIONS,
  HTTPS_PORT_LIST_OPTIONS,
  TLS_VERSIONS_OPTIONS,
  SUPPORTED_CIPHERS_LIST_OPTIONS,
  SUPPORTED_VERSIONS,
  checkIfFieldExist,
  InviteSession,
  azionPrivacyPolicyWindowOpener,
  azionOnboardingWindowOpener,
  azionTermsAndServicesWindowOpener,
  capitalizeFirstLetter,
  clipboardWrite,
  documentationCatalog,
  documentationGuideProducts,
  getEnvironment,
  getFirstApiError,
  getStaticUrlsByEnvironment,
  metricsPlaygroundOpener,
  openAPIDocumentation,
  openContactSupport,
  openDocumentation,
  openGoogleAuthenticatorAppDocumentation,
  openMarketplaceIntegrationsDocumentation,
  openSearchResult,
  openAzionSite,
  openAzionBlog,
  openAzionDiscord,
  openAzionGithub,
  openAzionX,
  parseCamelToSnake,
  parseSnakeToCamel,
  removeHtmlTagFromText,
  themeSelect,
  convertValueToDate,
  convertDateToLocalTimezone,
  windowOpen,
  getVulcanPresets,
  goToClassicInterface,
  formatDateToUS,
  formatCurrencyString,
  formatUnitValue,
  openShowMorePlan,
  getCsvCellContentFromRowData,
  useRouteFilterManager,
  FILTERS_RULES,
  openGraphQlPlayground,
  eventsPlaygroundOpener,
  setRedirectRoute,
  getRedirectRoute,
  disabledBackButton,
  buildSummary,
  INFORMATION_TEXTS,
  convertValueToDateByUserTimezone,
  getCurrentTimezone,
  TEXT_DOMAIN_WORKLOAD,
  adaptServiceDataResponse,
  formatDateMonthAndYear,
  getExpiredDate,
  getRemainingDays,
  getCurrentDateTimeIntl
}
