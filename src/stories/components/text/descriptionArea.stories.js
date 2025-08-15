import DescriptionArea from '../../../components/description-area'

export default {
  title: 'Components/text/descriptionArea',
  component: DescriptionArea,
  tags: ['autodocs'],
  argTypes: {
    description: {
      description: 'Description text'
    }
  }
}

export const Default = {
  args: {
    description: 'My description'
  }
}
