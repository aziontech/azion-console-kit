const RESOURCE_NOUNS = {
  application: ['application', 'applications'],
  firewall: ['firewall', 'firewalls'],
  custom_page: ['custom page', 'custom pages'],
  function: ['function', 'functions'],
  connector: ['connector', 'connectors'],
  network_list: ['network list', 'network lists'],
  waf: ['WAF', 'WAFs']
}

export const singularNounFor = (type) => RESOURCE_NOUNS[type]?.[0] ?? 'resource'

export const pluralNounFor = (type) => RESOURCE_NOUNS[type]?.[1] ?? 'resources'

export const withArticle = (noun) => `${/^[aeiou]/i.test(noun) ? 'an' : 'a'} ${noun}`

export const asFieldLabel = (noun) => `${noun.charAt(0).toUpperCase()}${noun.slice(1)}`
