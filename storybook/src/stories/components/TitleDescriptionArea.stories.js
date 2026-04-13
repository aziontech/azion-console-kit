import TitleDescriptionArea from '@/components/title-description-area/titleDescriptionArea.vue';

export default {
  title: 'Components/TitleDescriptionArea',
  component: TitleDescriptionArea,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'The title text to display'
    },
    description: {
      control: 'text',
      description: 'Optional description text that appears below the title'
    }
  },
  parameters: {
    docs: {
      description: {
        component: 'A compound component that combines TitleText and DescriptionText components. Useful for creating consistent header sections with both title and optional descriptive text.'
      }
    }
  }
};

export const Default = {
  args: {
    title: 'Section Title',
    description: 'This is a description that provides additional context about the section below.'
  }
};

export const TitleOnly = {
  args: {
    title: 'Section Without Description'
  }
};

export const LongTitleAndDescription = {
  args: {
    title: 'This is a Longer Section Title That Demonstrates Text Wrapping Behavior',
    description: 'This is a longer description that provides comprehensive context about the section. It can span multiple lines and will wrap naturally according to the container width. The description helps users understand what they can expect to find in this section.'
  }
};

export const MultiLineDescription = {
  args: {
    title: 'Multi-line Description',
    description: 'First point about this section\nSecond point with additional details\nThird point for clarity'
  }
};