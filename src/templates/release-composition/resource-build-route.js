const RESOURCE_EDIT_ROUTES = {
  application: 'edit-application',
  firewall: 'edit-firewall',
  custom_page: 'edit-custom-pages',
  function: 'edit-functions',
  connector: 'edit-connectors',
  network_list: 'edit-network-lists',
  waf: 'edit-waf-rules'
}

export const resourceBuildRoute = ({ type, resourceId } = {}) => {
  const name = RESOURCE_EDIT_ROUTES[type]
  if (!name || resourceId == null || resourceId === '') return null
  return { name, params: { id: String(resourceId) } }
}
