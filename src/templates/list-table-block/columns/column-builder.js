import { h } from 'vue'
import AvatarWithTextTooltipColumn from './avatar-with-text-tooltip-column.vue'
import AvatarWithTextColumn from './avatar-with-text-column.vue'
import TextWithClipboardColumn from './text-with-clipboard-column.vue'
import ClickableText from './clickable-text-column.vue'
import ClickableLink from './clickable-link-column.vue'
import ClickableTag from './clickable-tag-column.vue'
import ExpandColumn from './expand-column.vue'
import ExpandTextColumn from './expand-text-column.vue'
import Tag from 'primevue/tag'

/**
 * Build and return a specific column based on the given appearance.
 *
 * @param {Object} params - The parameters to build the column.
 * @param {string} params.columnAppearance - The appearance of the column.
 *   Valid values are:
 *   - 'expand-column'
 *   - 'expand-text-column'
 *   - 'avatar-with-text'
 *   - 'avatar-with-text-and-tooltip'
 *   - 'text-with-clipboard'
 *   - 'clickable-text'
 *   - 'clickable-tag'
 *   - 'clickable-link'
 *   - 'tag'
 * @param {Object} params.data - The data with specific properties of the column appearance.
 * @param {Object} [params.dependencies]- (Optional) The dependencies needed for rendering this column appearance.
 *
 * @returns {VNode} The constructed column as a Vue VNode.
 * @throws {Error} If an invalid column appearance is provided.
 */
export const columnBuilder = ({ data, columnAppearance, dependencies }) => {
  switch (columnAppearance) {
    case 'expand-column':
      return h(ExpandColumn, {
        value: data
      })
    case 'expand-text-column':
      return h(ExpandTextColumn, {
        value: data
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
        content: data,
        copyContentService: dependencies.copyContentService
      })
    case 'tag':
      return h(Tag, {
        value: data.content,
        icon: data.icon,
        severity: data.severity
      })
    default:
      throw new Error('Invalid column appearance')
  }
}
