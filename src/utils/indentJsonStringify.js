const indentJsonStringify = (json, indentation = 2) => {
  return JSON.stringify(json, null, indentation)
}

export default indentJsonStringify