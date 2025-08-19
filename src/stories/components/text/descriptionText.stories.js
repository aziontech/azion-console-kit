import DescriptionText from '../../../components/description-text'

export default {
  title: 'Components/text/descriptionText',
  component: DescriptionText,
  tags: ['autodocs'],
  argTypes: {
    description: {
      description: 'Description text'
    }
  }
}

export const Default = {
  args: {
    description: 'My description text'
  }
}
