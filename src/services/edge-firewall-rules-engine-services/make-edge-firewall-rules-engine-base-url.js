/**
 * @param {Number} edgeFirewallId
 * @returns {string}
 */
export const makeEdgeFirewallRulesEngineBaseUrl = (edgeFirewallId) => {
  return `v3/edge_firewall/${edgeFirewallId}/rules_engine`
}

export const makeEdgeFirewallRulesEngineReorderBaseUrl = (edgeFirewallId) => {
  return `v4/edge/firewall/${edgeFirewallId}/rules/order`
}
