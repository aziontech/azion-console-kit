import CardFlagBlock from '@/templates/card-flag-block/index.vue';

export default {
  title: 'Templates/CardFlagBlock',
  component: CardFlagBlock,
  tags: ['autodocs'],
  argTypes: {
    cardFlag: {
      control: 'select',
      options: ['visa', 'mastercard', 'jcb', 'discover', 'diners', 'amex'],
      description: 'Credit card brand flag to display'
    }
  },
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays the appropriate credit card brand logo based on the cardFlag prop.'
      }
    }
  }
};

export const Default = {
  args: {
    cardFlag: 'visa'
  }
};

export const Mastercard = {
  args: {
    cardFlag: 'mastercard'
  }
};

export const JCB = {
  args: {
    cardFlag: 'jcb'
  }
};

export const Discover = {
  args: {
    cardFlag: 'discover'
  }
};

export const Diners = {
  args: {
    cardFlag: 'diners'
  }
};

export const Amex = {
  args: {
    cardFlag: 'amex'
  }
};
