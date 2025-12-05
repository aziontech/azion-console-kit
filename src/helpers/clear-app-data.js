export const clearAppData = () => {
  const itemsToClear = [
    // Account store
    'account',
    // Theme
    // 'theme',
    // Pinia persisted stores
    'tableDefinitions',
    'deploy',
    'edgeDNS',
    'solutionCreate',
    // Other cached data
    'redirectRoute',
    'edge_sql_query_history',
    'edge_sql_current_database',
    'lastModifiedToggled'
  ]

  itemsToClear.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error clearing localStorage item:', key, error)
    }
  })

  const prefixesToClear = ['edge_sql_', 'schema_cache_']

  try {
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (prefixesToClear.some((prefix) => key.startsWith(prefix))) {
        localStorage.removeItem(key)
      }
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error clearing localStorage with prefixes:', error)
  }

  try {
    sessionStorage.clear()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error clearing sessionStorage:', error)
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('app-azion-sync')
      channel.postMessage({ type: 'logout' })
      channel.close()
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error broadcasting logout:', error)
  }
}
