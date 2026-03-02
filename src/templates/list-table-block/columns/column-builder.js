import { h } from 'vue'
import AvatarWithTextTooltipColumn from './avatar-with-text-tooltip-column.vue'
import AvatarWithTextColumn from './avatar-with-text-column.vue'
import TextWithClipboardColumn from './text-with-clipboard-column.vue'
import TextFullWithClipboardColumn from './text-full-with-clipboard-column.vue'
import ClickableText from './clickable-text-column.vue'
import ClickableLink from './clickable-link-column.vue'
import ClickableTag from './clickable-tag-column.vue'
import ExpandColumn from './expand-column.vue'
import ExpandTextColumn from './expand-text-column.vue'
import Tag from 'primevue/tag'
import LanguageIconWithTextColumn from './language-icon-with-text-column.vue'
import TextWithTagColumn from './text-with-tag-column.vue'
import CreditCardColumn from './credit-card-column.vue'
import CountryFlagColumn from './country-flag-column.vue'
import TagWithTooltip from './tag-with-tooltip'
import LogBody from './log-body.vue'
import TextWithIcon from './text-with-icon.vue'
import TextFormatColumn from './text-format.vue'
import IconWithTooltip from './icon-with-tooltip.vue'
import TextFormatWithPopupColumn from './text-format-with-popup.vue'
import TextArrayWithPopupColumn from './text-array-with-popup.vue'
import LastModifiedColumn from './last-modified-column.vue'

/**
 * Build and return a specific column based on the given appearance.
 *
 * @param {Object} params - The parameters to build the column.
 * @param {'expand-column'| 'expand-text-column'| 'avatar-with-text'| 'avatar-with-text-and-tooltip'| 'text-with-clipboard'| 'clickable-text'| 'clickable-tag'| 'clickable-link'| 'tag'| 'language-icon-with-text'| 'text-with-tag'| 'credit-card-column' | 'country-flag-column' | 'log-body' | 'last-modified'} params.columnAppearance - The appearance of the column.
 * @param {Object} params.data - The data with specific properties of the column appearance.
 * @param {Object} [params.dependencies] - (Optional) The dependencies needed for rendering this column appearance.
 *
 * @returns {VNode} The constructed column as a Vue VNode.
 * @throws {Error} If an invalid column appearance is provided.
 */
export const columnBuilder = ({ data, columnAppearance, dependencies }) => {
  switch (columnAppearance) {
    case 'text-format':
      return h(TextFormatColumn, {
        text: data.text
      })
    case 'text-format-with-popup':
      return h(TextFormatWithPopupColumn, {
        text: data.text || data,
        showCopy: dependencies?.showCopy || false
      })
    case 'text-array-with-popup':
      return h(TextArrayWithPopupColumn, {
        items: data,
        showCopy: dependencies?.showCopy || false
      })
    case 'expand-column':
      return h(ExpandColumn, {
        value: data,
        showCopy: dependencies?.showCopy || false
      })
    case 'expand-text-column':
      return h(ExpandTextColumn, {
        value: data.value,
        sliceValue: data.sliceValue,
        showMoreText: data.showMoreText
      })
    case 'avatar-with-text':
      return h(AvatarWithTextColumn, {
        nameInitial: data.nameInitial,
        tooltipText: data.tooltipText,
        text: data.timeDifference
      })
    case 'avatar-with-text-and-tooltip':
      return h(AvatarWithTextTooltipColumn, {
        nameInitial: data.nameInitial,
        tooltipText: data.tooltipText,
        text: data.timeDifference
      })
    case 'clickable-text':
      return h(ClickableText, {
        content: data.content,
        clickAction: dependencies.clickAction,
        clickProps: dependencies.clickProps
      })
    case 'clickable-link':
      return h(ClickableLink, {
        content: data.content,
        clickAction: dependencies.clickAction,
        clickProps: dependencies.clickProps
      })
    case 'clickable-tag':
      return h(ClickableTag, {
        content: data.content,
        clickAction: dependencies.clickAction,
        clickProps: dependencies.clickProps
      })
    case 'text-with-clipboard':
      return h(TextWithClipboardColumn, {
        content: data
      })
    case 'text-full-with-clipboard':
      return h(TextFullWithClipboardColumn, {
        content: data.content
      })
    case 'tag':
      return h(Tag, {
        value: data.content,
        icon: data.icon,
        severity: data.severity
      })
    case 'language-icon-with-text':
      return h(LanguageIconWithTextColumn, {
        language: data.icon,
        value: data.content
      })
    case 'text-with-tag':
      return h(TextWithTagColumn, {
        text: data.text,
        tagProps: data.tagProps
      })
    case 'credit-card-column':
      return h(CreditCardColumn, {
        cardNumber: data.cardNumber,
        cardBrand: data.cardBrand,
        status: data.status
      })
    case 'country-flag-column':
      return h(CountryFlagColumn, {
        country: data?.country,
        code: data?.code
      })
    case 'tag-with-tooltip':
      return h(TagWithTooltip, {
        tagProps: {
          value: data.content,
          icon: data.icon,
          severity: data.severity
        },
        tooltipText: data.tooltipText
      })
    case 'log-body':
      return h(LogBody, {
        value: data
      })
    case 'text-with-icon':
      return h(TextWithIcon, {
        text: data.text,
        leftIcon: data.leftIcon,
        rightIcon: data.rightIcon
      })
    case 'icon-with-tooltip':
      return h(IconWithTooltip, {
        vendorData: data.vendorData,
        iconClass: data.iconClass
      })
    case 'last-modified':
      return h(LastModifiedColumn, {
        rowData: data,
        handleMouseEnter: dependencies.handleMouseEnter,
        handleMouseLeave: dependencies.handleMouseLeave
      })
    default:
      throw new Error('Invalid column appearance')
  }
}
