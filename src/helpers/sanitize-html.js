const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;'
}

export function sanitizeHtml(value) {
  if (typeof value !== 'string') return value
  return value.replace(/[&<>"]/g, (char) => HTML_ENTITIES[char])
}
