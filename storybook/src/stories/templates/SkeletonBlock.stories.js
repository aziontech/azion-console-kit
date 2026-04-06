import SkeletonBlock from '@/templates/skeleton-block/index.vue';

export default {
  title: 'Templates/SkeletonBlock',
  component: SkeletonBlock,
  tags: ['autodocs'],
  argTypes: {
    isLoaded: {
      control: 'boolean',
      description: 'Whether content is loaded (shows content) or loading (shows skeleton)'
    },
    width: {
      control: 'text',
      description: 'Width of the skeleton (CSS value)'
    },
    elementType: {
      control: 'select',
      options: ['div', 'span'],
      description: 'HTML element type to render when loaded'
    },
    sizeHeight: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Preset height size (overrides height prop)'
    },
    height: {
      control: 'text',
      description: 'Height of the skeleton (CSS value, used if sizeHeight not set)'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A skeleton loading component that conditionally renders either a skeleton placeholder or actual content. Useful for showing loading states while data is being fetched.'
      }
    }
  }
};

export const Loading = {
  args: {
    isLoaded: false,
    width: '100%',
    height: '1.5rem'
  }
};

export const Loaded = {
  args: {
    isLoaded: true,
    width: '100%',
    height: '1.5rem'
  },
  render: (args) => ({
    components: { SkeletonBlock },
    setup() {
      return { args };
    },
    template: `
      <SkeletonBlock v-bind="args">
        <span>Actual content here</span>
      </SkeletonBlock>
    `
  })
};

export const SmallHeight = {
  args: {
    isLoaded: false,
    sizeHeight: 'small',
    width: '100%'
  }
};

export const MediumHeight = {
  args: {
    isLoaded: false,
    sizeHeight: 'medium',
    width: '100%'
  }
};

export const LargeHeight = {
  args: {
    isLoaded: false,
    sizeHeight: 'large',
    width: '100%'
  }
};

export const CustomDimensions = {
  args: {
    isLoaded: false,
    width: '200px',
    height: '3rem'
  }
};

export const SpanElement = {
  args: {
    isLoaded: true,
    elementType: 'span',
    width: 'auto',
    height: '1.5rem'
  },
  render: (args) => ({
    components: { SkeletonBlock },
    setup() {
      return { args };
    },
    template: `
      <div>
        <SkeletonBlock v-bind="args">
          <span>Inline content</span>
        </SkeletonBlock>
      </div>
    `
  })
};