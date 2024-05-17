/**
 * @param {Number} edgeFirewallId
 * @returns {string}
 */
export const makeEdgeFirewallRulesEngineBaseUrl = (edgeFirewallId) => {
  return `v3/edge_firewall/${edgeFirewallId}/rules_engine`
}
