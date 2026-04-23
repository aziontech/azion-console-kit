import SearchBlock from '@/templates/search-block/index.vue';

export default {
  title: 'Templates/SearchBlock',
  component: SearchBlock,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A search component with keyboard shortcuts and modal dialog.

**Features:**
- Desktop: Shows a search input field with keyboard shortcut hint (⌘K)
- Mobile: Shows a search button
- Opens a modal dialog when clicked or via keyboard shortcuts (Ctrl+K or ⌘+K)
- Modal includes escape key (ESC) to close
- Responsive design with breakpoints

**Keyboard Shortcuts:**
- \`Ctrl+K\` (Windows/Linux) or \`⌘+K\` (macOS): Opens search modal
- \`ESC\`: Closes search modal

**Dependencies:**
- Uses \`@vueuse/core\` for keyboard shortcut handling
- Uses PrimeVue components (InputText, Dialog, Button, Tag)
        `
      }
    }
  }
};

export const Default = {
  args: {}
};