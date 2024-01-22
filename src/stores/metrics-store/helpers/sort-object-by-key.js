export default function SortObjectByKey(unsortedObj) {
  const res = Object.keys(unsortedObj)
    .sort((prev, next) => prev.localeCompare(next))
    .reduce((obj, key) => {
      const newObj = { ...obj }
      newObj[key] = unsortedObj[key]
      return newObj
    }, {})

  return res
}
