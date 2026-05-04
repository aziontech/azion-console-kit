import { h } from 'vue'
import Tag from 'primevue/tag'

// Consolidated webkit components
import {
  CellDisplay,
  CellClipboard,
  CellExpand,
  CountryFlag
} from '@aziontech/webkit/list-data-table/cells'

// Domain-specific components (console only)
import CreditCardColumn from './credit-card-column.vue'
import LanguageIconWithTextColumn from './language-icon-with-text-column.vue'
import LogBody from './log-body.vue'
import LastModifiedColumn from './last-modified-column.vue'

/**
 * Build and return a specific column based on the given appearance.
 *
 * @param {Object} params - The parameters to build the column.
 * @param {'expand-column'| 'expand-text-column'| 'avatar-with-text'| 'avatar-with-text-and-tooltip'| 'text-with-clipboard'| 'text-full-with-clipboard'| 'text-format'| 'text-format-with-popup'| 'text-array-with-popup'| 'clickable-text'| 'clickable-tag'| 'clickable-link'| 'tag'| 'tag-with-tooltip'| 'text-with-tag'| 'text-with-icon'| 'icon-with-tooltip'| 'language-icon-with-text'| 'credit-card-column' | 'country-flag-column' | 'log-body' | 'last-modified'} params.columnAppearance - The appearance of the column.
 * @param {Object} params.data - The data with specific properties of the column appearance.
 * @param {Object} [params.dependencies] - (Optional) The dependencies needed for rendering this column appearance.
 *
 * @returns {VNode} The constructed column as a Vue VNode.
 * @throws {Error} If an invalid column appearance is provided.
 */
export const columnBuilder = ({ data, columnAppearance, dependencies }) => {
  switch (columnAppearance) {
    // --- CellDisplay: text, icon, avatar, tag, clickable ---
    case 'text-format':
      return h(CellDisplay, { text: data.text || data })

    case 'avatar-with-text':
      return h(CellDisplay, {
        avatar: data.nameInitial,
        text: data.timeDifference
      })

    case 'avatar-with-text-and-tooltip':
      return h(CellDisplay, {
        avatar: data.nameInitial,
        text: data.timeDifference,
        tooltip: data.tooltipText,
        tooltipPosition: 'bottom'
      })

    case 'text-with-icon':
      return h(CellDisplay, {
        text: data.text,
        icon: data.leftIcon || data.rightIcon,
        iconPosition: data.rightIcon ? 'right' : 'left'
      })

    case 'text-with-tag':
      return h(CellDisplay, {
        text: data.text,
        tag: data.tagProps
      })

    case 'tag-with-tooltip':
      return h(CellDisplay, {
        tag: {
          value: data.content,
          icon: data.icon,
          severity: data.severity
        },
        tooltip: data.tooltipText
      })

    case 'icon-with-tooltip':
      return data.vendorData
        ? h(CellDisplay, {
            icon: data.iconClass || 'pi pi-shopping-cart text-xl',
            tooltip: data.vendorData
          })
        : h(CellDisplay, { text: '' })

    case 'clickable-text':
      return h(CellDisplay, {
        text: data.content,
        clickable: true,
        clickVariant: 'text',
        onClick: dependencies.clickAction,
        clickProps: dependencies.clickProps
      })

    case 'clickable-link':
      return h(CellDisplay, {
        text: data.content,
        clickable: true,
        clickVariant: 'link',
        onClick: dependencies.clickAction,
        clickProps: dependencies.clickProps
      })

    case 'clickable-tag':
      return h(CellDisplay, {
        tag: data.content,
        clickable: true,
        clickVariant: 'tag',
        onClick: dependencies.clickAction,
        clickProps: dependencies.clickProps
      })

    // --- CellClipboard: text + copy ---
    case 'text-with-clipboard':
      return h(CellClipboard, {
        content: typeof data === 'object' && data !== null ? data.content : String(data ?? ''),
        mode: 'hover'
      })

    case 'text-full-with-clipboard':
      return h(CellClipboard, {
        content: data.content,
        mode: 'full'
      })

    case 'text-format-with-popup':
      return h(CellClipboard, {
        content: data.text || data,
        mode: 'popup',
        showCopy: dependencies?.showCopy || false
      })

    // --- CellExpand: expandable content ---
    case 'expand-column':
      return h(CellExpand, {
        value: data,
        variant: 'list',
        showCopy: dependencies?.showCopy || false
      })

    case 'expand-text-column':
      return h(CellExpand, {
        value: data.value,
        variant: 'text',
        limit: data.sliceValue
      })

    case 'text-array-with-popup':
      return h(CellExpand, {
        value: data,
        variant: 'popup',
        showCopy: dependencies?.showCopy || false
      })

    // --- CountryFlag ---
    case 'country-flag-column':
      return h(CountryFlag, {
        country: data?.country,
        code: data?.code
      })

    // --- PrimeVue Tag (direct) ---
    case 'tag':
      return h(Tag, {
        value: data.content,
        icon: data.icon,
        severity: data.severity
      })

    // --- Domain-specific (console only) ---
    case 'language-icon-with-text':
      return h(LanguageIconWithTextColumn, {
        language: data.icon,
        value: data.content
      })

    case 'credit-card-column':
      return h(CreditCardColumn, {
        cardNumber: data.cardNumber,
        cardBrand: data.cardBrand,
        status: data.status
      })

    case 'log-body':
      return h(LogBody, { value: data })

    case 'last-modified':
      return h(LastModifiedColumn, {
        rowData: data,
        handleMouseEnter: dependencies.handleMouseEnter,
        handleMouseLeave: dependencies.handleMouseLeave
      })

    default:
      throw new Error(`Invalid column appearance: ${columnAppearance}`)
  }
}
