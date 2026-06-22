// The brand color we keep (#E850A8). Any other inline `color` coming from the
// script-runner API renders poorly against the log theme, so we strip just that
// declaration while preserving the rest of the style attribute.
const ALLOWED_LOG_COLOR = '#e850a8'

export const sanitizeLogColors = (content) => {
  if (!content || typeof content !== 'string') return content

  return content.replace(/\s*style=(["'])(.*?)\1/gi, (_match, quote, styleBody) => {
    const declarations = styleBody
      .split(';')
      .map((declaration) => declaration.trim())
      .filter(Boolean)
      .filter((declaration) => {
        const [property, ...value] = declaration.split(':')
        if (property.trim().toLowerCase() !== 'color') return true
        return value.join(':').trim().toLowerCase() === ALLOWED_LOG_COLOR
      })

    if (!declarations.length) return ''
    return ` style=${quote}${declarations.join('; ')}${quote}`
  })
}
