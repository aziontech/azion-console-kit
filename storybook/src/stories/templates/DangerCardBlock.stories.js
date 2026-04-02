import DangerCardBlock from '@/templates/danger-card-block/index.vue';

export default {
  title: 'Templates/DangerCardBlock',
  component: DangerCardBlock,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title displayed in the danger card'
    },
    description: {
      control: 'text',
      description: 'Optional description text below the title'
    },
    buttonLabel: {
      control: 'text',
      description: 'Label for the action button'
    },
    loading: {
      control: 'boolean',
      description: 'Shows loading state on the action button'
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the action button'
    }
  },
  parameters: {
    docs: {
      description: {
        component: `A warning card component for dangerous actions like deletions.

**Events:**
- \`action\`: Emitted when the action button is clicked`
      }
    }
  }
};

export const Default = {
  args: {
    title: 'Danger area',
    description: 'This action cannot be undone. Please proceed with caution.',
    buttonLabel: 'Delete',
    loading: false,
    disabled: false
  }
};

export const WithLoading = {
  args: {
    title: 'Delete Account',
    description: 'Once you delete your account, there is no going back. Please be certain.',
    buttonLabel: 'Delete Account',
    loading: true,
    disabled: false
  }
};

export const Disabled = {
  args: {
    title: 'Danger zone',
    description: 'This action is currently disabled.',
    buttonLabel: 'Delete',
    loading: false,
    disabled: true
  }
};

export const MinimalConfig = {
  args: {
    title: 'Simple Danger Card',
    buttonLabel: 'Remove'
  }
};
