import MessageNotification from '@/templates/message-notification/index.vue';

export default {
  title: 'Templates/MessageNotification',
  component: MessageNotification,
  tags: ['autodocs'],
  argTypes: {
    typeMessage: {
      control: 'select',
      options: ['info', 'warning', 'success', 'error'],
      description: 'Type of notification message (determines styling and icon)'
    },
    title: {
      control: 'text',
      description: 'Notification title text'
    },
    description: {
      control: 'text',
      description: 'Notification description text'
    },
    icon: {
      control: 'text',
      description: 'Optional custom icon class (overrides default type icon)'
    },
    buttons: {
      control: 'object',
      description: 'Array of button objects to display in the actions area'
    }
  },
  parameters: {
    docs: {
      description: {
        component: `A notification message component with customizable type, title, description, and action buttons.

**Features:**
- Four message types: info, warning, success, error
- Automatic icon and color styling based on type
- Custom icon support
- Action buttons support
- Responsive layout (stacked on mobile, inline on desktop)

**Slots:**
- \`title\`: Custom title content
- \`description\`: Custom description content
- \`actions\`: Custom action buttons area`
      }
    }
  }
};

export const Default = {
  args: {
    typeMessage: 'info',
    title: 'Information',
    description: 'This is an informational message to notify users about important details.'
  }
};

export const Warning = {
  args: {
    typeMessage: 'warning',
    title: 'Warning',
    description: 'Please review this warning carefully before proceeding.'
  }
};

export const Success = {
  args: {
    typeMessage: 'success',
    title: 'Success',
    description: 'Your changes have been saved successfully.'
  }
};

export const Error = {
  args: {
    typeMessage: 'error',
    title: 'Error',
    description: 'An error occurred while processing your request.'
  }
};

export const WithActionButtons = {
  args: {
    typeMessage: 'warning',
    title: 'Unsaved Changes',
    description: 'You have unsaved changes. Would you like to save them before leaving?',
    buttons: [
      {
        label: 'Save Changes',
        severity: 'primary',
        // eslint-disable-next-line no-console
        onClick: () => console.log('Save clicked')
      },
      {
        label: 'Discard',
        severity: 'secondary',
        // eslint-disable-next-line no-console
        onClick: () => console.log('Discard clicked')
      }
    ]
  }
};

export const WithCustomIcon = {
  args: {
    typeMessage: 'info',
    title: 'Tips & Tricks',
    description: 'Did you know you can use keyboard shortcuts to navigate faster?',
    icon: 'pi pi-lightbulb'
  }
};

export const WithSlots = {
  render: (args) => ({
    components: { MessageNotification },
    setup() {
      return { args };
    },
    template: `
      <MessageNotification v-bind="args">
        <template #title>
          <span class="font-bold text-lg">Custom Title with <span class="text-blue-400">Formatting</span></span>
        </template>
        <template #description>
          <span>Custom description with <strong>bold text</strong> and <em>italics</em>.</span>
        </template>
        <template #actions>
          <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Custom Action
          </button>
        </template>
      </MessageNotification>
    `
  }),
  args: {
    typeMessage: 'info'
  }
};

export const MultipleButtons = {
  args: {
    typeMessage: 'info',
    title: 'Choose an Action',
    description: 'Multiple action buttons are available for this notification.',
    buttons: [
      {
        label: 'Primary Action',
        severity: 'primary'
      },
      {
        label: 'Secondary Action',
        severity: 'secondary'
      },
      {
        label: 'Tertiary Action',
        severity: 'secondary',
        outlined: true
      }
    ]
  }
};
