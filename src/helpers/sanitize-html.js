const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;'
}

export function sanitizeHtml(value) {
  if (typeof value !== 'string') return value
  return value.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char])
}
