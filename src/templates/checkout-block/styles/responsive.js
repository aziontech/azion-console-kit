// Shared responsive class presets for billing + onboarding surfaces.
// Single source of truth so drawer widths, dialog widths, and touch targets
// stay consistent and mobile-safe across the flow.

// Sidebar/drawer: mobile-first, full width up to a safety margin on phones,
// fixed widths from `md` (tablet) and `lg` (desktop) upward.
export const DRAWER_SIDEBAR_CLASSES =
  'w-full sm:w-[480px] md:w-[640px] lg:w-[960px] max-w-[calc(100vw-16px)]'

export const DRAWER_SIDEBAR_NARROW_CLASSES =
  'w-full sm:w-[420px] md:w-[480px] lg:w-[560px] max-w-[calc(100vw-16px)]'

// Dialog: caps at 576px on desktop, scales down with viewport on mobile.
// `min(90vw, …)` avoids the awkward 16px-margin clipping on iPhone SE-class
// devices that the hardcoded 576px width caused.
export const DIALOG_STYLE_MEDIUM = Object.freeze({ width: 'min(90vw, 576px)' })
export const DIALOG_STYLE_SMALL = Object.freeze({ width: 'min(90vw, 480px)' })

// CTA touch targets: ≥40px on mobile (WCAG/Apple HIG minimum), compact on
// desktop where pointer input is precise.
export const CTA_BUTTON_CLASSES =
  'h-10 md:h-8 px-4 font-protomono text-sm md:text-xs flex items-center justify-center'

// Container/padding scale used by checkout sections, dialogs, banners.
export const SECTION_PADDING_CLASSES = 'px-4 md:px-6 lg:px-8'
