/**
 * Single import surface for the release-impact test harness.
 *
 * Downstream specs (tasks 3.2, 3.4, 5.2, 6.2, 7.3, 9.3, 9.4, 10.3) import their
 * fixtures and fast-check arbitraries from here, so fixture shapes live in one
 * place and stay aligned with the production data contracts.
 */
export {
  asListResponse,
  makeWorkload,
  makeBinding,
  v6WorkloadsList,
  legacyWorkloadsList,
  environmentsList,
  envNameById
} from './fixtures'

export {
  domainArb,
  environmentIdArb,
  bindingArb,
  workloadArb,
  workloadsListArb,
  envNameMapArb
} from './arbitraries'
