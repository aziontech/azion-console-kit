const adaptVariables = (payload) => {
  let variables = []

  let rows = payload.variables.split('\n')
  for (let i = 0; i < rows.length; i++) {
    let parts = rows[i].split('=')
    if (parts.length === 2) {
      let obj = {}
      obj.name = parts[0].trim()
      obj.value = parts[1].trim()
      variables.push(obj)
    }
  }

  return variables;
}

export default {
  adaptVariables
}