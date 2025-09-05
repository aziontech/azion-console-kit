import TitleDescriptionArea from '../../../components/title-description-area'

export default {
  title: 'Components/text/titleDescriptionArea',
  component: TitleDescriptionArea,
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Title text'
    },
    description: {
      description: 'Description text'
    }
  }
}

export const Default = {
  args: {
    title: 'My Title Area',
    description: 'My description'
  }
}
