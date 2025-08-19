import TitleText from '../../../components/title-text'

export default {
  title: 'Components/text/TitleText',
  component: TitleText,
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Title text'
    }
  }
}

export const Default = {
  args: {
    title: 'My Title Area'
  }
}
