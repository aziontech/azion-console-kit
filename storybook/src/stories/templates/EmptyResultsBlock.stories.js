import EmptyResultsBlock from '@/templates/empty-results-block/index.vue';

export default {
  title: 'Templates/EmptyResultsBlock',
  component: EmptyResultsBlock,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Title text for the empty state'
    },
    description: {
      control: 'text',
      description: 'Description text for the empty state'
    },
    createButtonLabel: {
      control: 'text',
      description: 'Label for the create button'
    },
    disabledList: {
      control: 'boolean',
      description: 'Disable the create button'
    },
    inTabs: {
      control: 'boolean',
      description: 'Adjust styling for tab context'
    },
    noBorder: {
      control: 'boolean',
      description: 'Remove border from container'
    },
    showLearnMoreButton: {
      control: 'boolean',
      description: 'Show or hide the learn more button'
    }
  }
};

export const Default = {
  args: {
    title: 'No items found',
    description: 'Get started by creating your first item.',
    createButtonLabel: 'Create Item',
    showLearnMoreButton: true
  }
};

export const WithoutCreateButton = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
    showLearnMoreButton: true
  }
};

export const DisabledCreate = {
  args: {
    title: 'No items found',
    description: 'You do not have permission to create items.',
    createButtonLabel: 'Create Item',
    disabledList: true
  }
};

export const InTabs = {
  args: {
    title: 'No items found',
    description: 'Get started by creating your first item.',
    createButtonLabel: 'Create Item',
    inTabs: true
  }
};

export const NoBorder = {
  args: {
    title: 'No items found',
    description: 'Get started by creating your first item.',
    createButtonLabel: 'Create Item',
    noBorder: true
  }
};
