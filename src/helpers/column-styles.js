const FIT_CONTENT =
  'width: auto !important; white-space: nowrap !important; max-width: fit-content !important'

const COLUMN_STYLES = {
  FIT_CONTENT,
  PRIORITY_XS: 'width: 10%; min-width: 100px !important',
  PRIORITY_SM: 'width: 15%; min-width: 120px !important',
  PRIORITY_MD: 'width: 20%; min-width: 150px !important',
  PRIORITY_LG: 'width: 25%; min-width: 180px !important',
  PRIORITY_XL: 'width: 30%; min-width: 200px !important'
}

const columnStyles = {
  fitContent: () => FIT_CONTENT,

  priority: (weight = 1, minWidth = 120, maxWidth = null) => {
    const percent = weight * 10
    let style = `width: ${percent}% !important; min-width: ${minWidth}px !important;`
    if (maxWidth) {
      style += ` max-width: ${maxWidth}px !important;`
    }
    return style
  }
}

export { COLUMN_STYLES, columnStyles }
