import TitleText from '@/components/title-text/titleText.vue';

export default {
  title: 'Components/TitleText',
  component: TitleText,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title text to display'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A simple title component that displays text with consistent styling (text-xl font-medium). Use this component for section headings and titles throughout the application.'
      }
    }
  }
};

export const Default = {
  args: {
    title: 'Section Title'
  }
};

export const LongTitle = {
  args: {
    title: 'This is a very long title that demonstrates how the component handles extended text content'
  }
};

export const ShortTitle = {
  args: {
    title: 'Title'
  }
};