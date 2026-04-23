import StepsBlock from '@/templates/steps-block/index.vue';

export default {
  title: 'Templates/StepsBlock',
  component: StepsBlock,
  tags: ['autodocs'],
  argTypes: {
    stepsItems: {
      control: 'object',
      description: 'Array of step items with route and label properties'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A wrapper around PrimeVue Steps component that integrates with Vue Router for navigable step navigation.'
      }
    }
  }
};

export const Default = {
  args: {
    stepsItems: [
      {
        label: 'Step 1',
        route: '/step-1'
      },
      {
        label: 'Step 2',
        route: '/step-2'
      },
      {
        label: 'Step 3',
        route: '/step-3'
      }
    ]
  }
};

export const ManySteps = {
  args: {
    stepsItems: [
      {
        label: 'Personal Info',
        route: '/personal-info'
      },
      {
        label: 'Account Setup',
        route: '/account-setup'
      },
      {
        label: 'Preferences',
        route: '/preferences'
      },
      {
        label: 'Review',
        route: '/review'
      },
      {
        label: 'Complete',
        route: '/complete'
      }
    ]
  }
};

export const MinimalSteps = {
  args: {
    stepsItems: [
      {
        label: 'Start',
        route: '/start'
      },
      {
        label: 'Finish',
        route: '/finish'
      }
    ]
  }
};