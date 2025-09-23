const getViewport = (innerWidth = '') => {
  if (innerWidth < 640) return ''
  if (innerWidth >= 640 && innerWidth < 768) return 'sm'
  if (innerWidth >= 768 && innerWidth < 1024) return 'md'
  if (innerWidth >= 1024 && innerWidth < 1280) return 'lg'
  if (innerWidth >= 1280 && innerWidth < 1536) return 'xl'
  if (innerWidth >= 1536) return '2xl'
}

export { getViewport }
