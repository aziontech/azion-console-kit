export default function structuredClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}