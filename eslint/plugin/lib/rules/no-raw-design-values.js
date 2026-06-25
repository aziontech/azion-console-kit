/**
 * Enforces the @aziontech/webkit + @aziontech/theme design system.
 *
 * Flags raw visual primitives that must come from tokens instead:
 * hardcoded colors, Tailwind palette/typography/spacing/radius/shadow
 * utilities, and legacy PrimeVue aliases. See the azion-design-system
 * skill for the full rule set; this lint is the build-time guard.
 *
 * Scans `class`/`:class` strings (template + script literals) and inline
 * `style`. The token-correct form is `*-[var(--…)]` or a semantic class.
 */

// `(?<![\w-])` keeps utility names from matching inside a --token name or a
// hyphenated identifier (e.g. var(--shadow-sm), var(--shape-button)).
const START = '(?<![\\w-])'

// Raw color functions and hex literals (Hard Rule #1).
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\s*\(/

// Tailwind palette utilities, e.g. bg-gray-500, text-violet-600 (Hard Rule #2).
const PALETTE_COLORS =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const PALETTE_UTILITY = new RegExp(
  `${START}(?:bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|shadow|accent|caret|placeholder)-(?:${PALETTE_COLORS})-(?:50|[1-9]00|950)\\b`
)

// Raw typography utilities, e.g. text-xs, text-2xl (Hard Rule #3).
const RAW_TYPOGRAPHY = new RegExp(`${START}text-(?:xs|sm|base|lg|xl|[2-9]xl)\\b`)

// Local typography primitives baked into the component (Hard Rule #4).
const TYPOGRAPHY_PRIMITIVE = new RegExp(
  `${START}(?:font-sora|font-proto-mono|leading-\\w+|tracking-\\w+)\\b`
)

// Arbitrary Tailwind-scale spacing, e.g. p-4, gap-3, m-6 (Hard Rule #5).
const RAW_SPACING = new RegExp(
  `${START}(?:px|py|pt|pr|pb|pl|p|mx|my|mt|mr|mb|ml|m|gap-x|gap-y|gap|space-x|space-y)-\\d+(?:\\.\\d+)?\\b`
)

// Raw radius, e.g. rounded-md, rounded-[12px] (Hard Rule #6).
const RAW_RADIUS = new RegExp(
  `${START}rounded(?:-(?:sm|md|lg|xl|[2-9]xl|full|none))?\\b(?!-\\[var\\()|${START}rounded-\\[\\d`
)

// Raw shadows without var(--shadow-*) (Hard Rule #7).
const RAW_SHADOW = new RegExp(
  `${START}shadow(?:-(?:sm|md|lg|xl|[2-9]xl|inner|none))?\\b(?!-\\[var\\()|${START}shadow-\\[(?!var\\()`
)

// Legacy PrimeVue aliases (Hard Rule #8).
const PRIMEVUE_LEGACY = new RegExp(`${START}(?:text-color|surface-\\w+)\\b|--card-shadow`)

// Raw container widths, e.g. max-w-7xl, max-w-[1200px] (Hard Rule #9).
const RAW_CONTAINER = new RegExp(
  `${START}max-w-(?:xs|sm|md|lg|xl|[2-9]xl|screen-\\w+|prose)\\b|${START}max-w-\\[\\d`
)

const CHECKS = [
  { id: 'rawColor', re: RAW_COLOR },
  { id: 'paletteUtility', re: PALETTE_UTILITY },
  { id: 'rawTypography', re: RAW_TYPOGRAPHY },
  { id: 'typographyPrimitive', re: TYPOGRAPHY_PRIMITIVE },
  { id: 'rawSpacing', re: RAW_SPACING },
  { id: 'rawRadius', re: RAW_RADIUS },
  { id: 'rawShadow', re: RAW_SHADOW },
  { id: 'primevueLegacy', re: PRIMEVUE_LEGACY },
  { id: 'rawContainer', re: RAW_CONTAINER }
]

function checkString(value, node, context) {
  if (typeof value !== 'string' || !value) return
  for (const { id, re } of CHECKS) {
    const match = value.match(re)
    if (match) {
      context.report({ node, messageId: id, data: { match: match[0] } })
      return
    }
  }
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce @aziontech/webkit + @aziontech/theme tokens. No raw colors, Tailwind palette/typography/spacing/radius/shadow utilities, or legacy PrimeVue aliases.',
      category: 'Design System'
    },
    schema: [],
    messages: {
      rawColor:
        'Raw color "{{match}}" violates the design system. Use bg-[var(--…)] / text-[var(--…)] / border-[var(--…)].',
      paletteUtility:
        'Tailwind palette utility "{{match}}" violates the design system. Use a semantic var(--…) token.',
      rawTypography:
        'Raw typography utility "{{match}}" violates the design system. Use a .text-* class from texts.data.js (text-body-md, text-heading-xl…).',
      typographyPrimitive:
        'Local typography primitive "{{match}}" violates the design system. Typography lives in texts.data.js .text-* classes.',
      rawSpacing:
        'Arbitrary spacing "{{match}}" violates the design system. Use px-[var(--spacing-*)] / gap-[var(--spacing-*)] or a semantic spacing utility.',
      rawRadius: 'Raw radius "{{match}}" violates the design system. Use rounded-[var(--shape-*)].',
      rawShadow: 'Raw shadow "{{match}}" violates the design system. Use shadow-[var(--shadow-*)].',
      primevueLegacy:
        'Legacy PrimeVue alias "{{match}}" violates the design system. Map to a semantic var(--…) token.',
      rawContainer:
        'Raw container width "{{match}}" violates the design system. Use max-w-[var(--container-*)].'
    }
  },

  create(context) {
    // Script + plain .js literals: class lists assembled in <script>.
    const scriptVisitor = {
      Literal(node) {
        if (typeof node.value === 'string') checkString(node.value, node, context)
      },
      TemplateElement(node) {
        checkString(node.value && node.value.cooked, node, context)
      }
    }

    // Template body (<template>) is only reachable via parserServices in
    // vue-eslint-parser; plain visitor keys would never fire for it.
    const templateVisitor = {
      // Static attributes: class="…" / style="…".
      VLiteral(node) {
        checkString(node.value, node, context)
      },
      // Bound/interpolated string literals: :class="'…'", {{ '…' }}.
      Literal(node) {
        if (typeof node.value === 'string') checkString(node.value, node, context)
      },
      TemplateElement(node) {
        checkString(node.value && node.value.cooked, node, context)
      }
    }

    const services = (context.sourceCode || context).parserServices || context.parserServices
    if (services && typeof services.defineTemplateBodyVisitor === 'function') {
      return services.defineTemplateBodyVisitor(templateVisitor, scriptVisitor)
    }
    return scriptVisitor
  }
}
