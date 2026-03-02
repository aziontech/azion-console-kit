import { marked } from 'marked'

/**
 * Convert markdown to HTML using the marked library
 * More robust markdown parsing than custom implementation
 */
export const markdownToHtml = (markdown) => {
  if (!markdown) return ''
  
  // Configure marked to handle markdown properly
  marked.setOptions({
    gfm: true,  // GitHub Flavored Markdown
    breaks: true  // Convert newlines to <br> tags
  })
  
  const html = marked.parse(markdown)
  
  return html
}
    