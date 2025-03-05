export default class Aql {
  constructor() {
    // Inicializações se necessário
  }

  parse(query, suggestions) {
    const expressions = query.split(/and/i).map(exp => exp.trim())

    const output = expressions.map(exp => {
      const regex = /^(?:"([^"]+)"|'([^']+)'|([\w\s]+?))\s*(=|>|<|>=|<=|BETWEEN|<>|LIKE|ILIKE|IN)\s*(.+)$/i
      const match = exp.match(regex)
      if (match) {
        let field = match[1] || match[2] || match[3]
        field = field.trim()

        const suggestion = suggestions.find(item => item.label.toLowerCase() === field.toLowerCase())
        if (suggestion) {
          field = suggestion.label
        }

        let operator = match[4]
        let value = match[5].trim()

        const operatorInfo = this.operatorInfo(suggestion.value.operator, this.mapOperatorValue(operator))

        if (operator.toUpperCase() === 'BETWEEN') {
          const values = value.split(/\s+and\s+/i);
          if (values.length === 2) {
            let val1, val2;
            if (suggestion && suggestion.value.type.toLowerCase() === 'int') {
              val1 = Number(values[0].trim())
              val2 = Number(values[1].trim())
            } else {
              val1 = values[0].replace(/^["']|["']$/g, '').trim()
              val2 = values[1].replace(/^["']|["']$/g, '').trim()
            }
            return {
              value: [val1, val2],
              operator: operatorInfo.value,
              valueField: field.toLowerCase(),
              type: operatorInfo.type ?? 'Int'
            }
          }
        }

        let parsedValue;
        if (suggestion && operatorInfo.type.toLowerCase() === 'int') {
          parsedValue = Number(value);
        } else {
          parsedValue = value.replace(/^["']|["']$/g, '')
        }

        return {
          value: parsedValue,
          operator: operatorInfo.value,
          valueField: field.toLowerCase(),
          type: operatorInfo.type ?? 'Int'
        };
      }
      return null
    }).filter(item => item !== null)

    return output
  }

  operatorInfo(operators, operator) {
    return operators.find(op => op.label === operator)?.value
  }

  mapOperatorValue(op) {
    switch (op) {
      case 'in': return 'In';
      case '=': return 'Equals';
      case '<>': return 'Not Equals';
      case 'like': return 'Contains';
      case 'ilike': return 'Not Contains';
      case 'between': return 'Between';
      case '<': return 'Less Than';
      case '<=': return 'Less Than or Equal';
      case '>': return 'Greater Than';
      case '>=': return 'Greater Than or Equal';
      default: return op;
    }
  }

  selectSuggestion(suggestion, query, step) {
    if (step === 'field') {
      if (query.toLowerCase().includes(' and ')) {
        const parts = query.split(/\s+and\s+/i)
        let newField = suggestion.label.toLowerCase()
        if (newField.includes(' ')) {
          newField = `"${newField}"`
        }
        parts[parts.length - 1] = newField
        return parts.join(' and ') + ' '
      } else {
        let newField = suggestion.label.toLowerCase()
        if (newField.includes(' ')) {
          return `"${newField}"`
        }
        return newField + ' '
      }
    }
  }

  handleInputMatching(query, suggestions) {
    const parts = query.split(/\s+and\s+/i)
    const tokenRaw = parts.pop().trim()
    const tokenForMatch = tokenRaw.replace(/^["']|["']$/g, '').toLowerCase()

    const fieldComplete = query.endsWith(' ')

    const matchingFields = suggestions.filter((item) => item.label.toLowerCase().startsWith(tokenForMatch))

    if (matchingFields.length === 1) {
      const matchedField = matchingFields[0]

      if (matchedField.label.includes(' ')) {
        const tokenIsComplete = (tokenRaw.startsWith('"') && tokenRaw.endsWith('"')) || (tokenRaw.startsWith("'") && tokenRaw.endsWith("'"))

        if (fieldComplete && tokenIsComplete) {
          return { operator: 'operator', selectedField: matchedField.label.toLowerCase() }
        }
      } else {
        if (fieldComplete && tokenForMatch === matchedField.label.toLowerCase()) {
          return { operator: 'operator', selectedField: matchedField.label.toLowerCase() }
        }
      }
    }
    return { operator: 'field', selectedField: '' }
  }

  queryValidator(query, suggestions) {
    const hasErrorInCompoundFields = this.queryValidationForCompoundFields(query)
    const hasErrorInFields = this.queryValidationIfFieldsExistInList(query, suggestions)

    return [...hasErrorInCompoundFields, ...hasErrorInFields]
  }

  queryValidationForCompoundFields(queryText) {
    let erros = []
    const operadores = ['=', '<>', '<', '>', '<=', '>=', 'like', 'ilike', 'between', 'in']
    if (queryText.toLowerCase().includes('and')) {
      const expressions = queryText.split(/\s+and\s+/i)
      expressions.forEach((expression) => {
        let operatorFound = operadores.find((op) => expression.toLowerCase().includes(op))
        if (operatorFound) {
          let stringBeforeOperator = expression.split(operatorFound)[0].trim()
          if (stringBeforeOperator.includes(' ')) {
            if (
              !(
                (stringBeforeOperator.startsWith('"') && stringBeforeOperator.endsWith('"')) ||
                (stringBeforeOperator.startsWith("'") && stringBeforeOperator.endsWith("'"))
              )
            ) {
              if (!erros.includes('quote-error')) {
                erros.push('quote-error')
              }
            }
          }
        } else {
          if (expression.includes(' ') && /\s+\S+/.test(expression)) {
            if (
              !(
                (expression.trim().startsWith('"') && expression.trim().endsWith('"')) ||
                (expression.trim().startsWith("'") && expression.trim().endsWith("'"))
              )
            ) {
              if (!erros.includes('quote-error')) {
                erros.push('quote-error')
              }
            }
          }
        }
      })
    } else {
      let operatorFound = operadores.find((op) => queryText.toLowerCase().includes(op))
      if (operatorFound) {
        let stringBeforeOperator = queryText.split(operatorFound)[0].trim()

        if (stringBeforeOperator.includes(' ')) {
          if (
            !(
              (stringBeforeOperator.startsWith('"') && stringBeforeOperator.endsWith('"')) ||
              (stringBeforeOperator.startsWith("'") && stringBeforeOperator.endsWith("'"))
            )
          ) {
            if (!erros.includes('quote-error')) {
              erros.push('quote-error')
            }
          }
        }
      } else {
        if (queryText.includes(' ') && /\s+\S+/.test(queryText)) {
          if (
            !(
              (queryText.trim().startsWith('"') && queryText.trim().endsWith('"')) ||
              (queryText.trim().startsWith("'") && queryText.trim().endsWith("'"))
            )
          ) {
            if (!erros.includes('quote-error')) {
              erros.push('quote-error')
            }
          }
        }
      }
    }

    return erros
  }

  queryValidationIfFieldsExistInList(query, suggestions) {
    let erros = []
    const operadores = ['=', '<>', '<', '>', '<=', '>=', 'like', 'ilike', 'between', 'in']

    if (!query.includes('and') && !query.includes(' ')) return []

    const expressions = query.split(/\s+and\s+/i)

    expressions.forEach((expression) => {
      if (!expression || !expression.endsWith(' ')) return
      const operatorFound = operadores.find((op) => expression.toLowerCase().includes(op))

      let fieldPart
      if (operatorFound) {
        fieldPart = expression.split(operatorFound)[0].trim()
      } else {
        fieldPart = expression.trim()
      }

      const fieldName = fieldPart.replace(/^["']|["']$/g, '')

      const found = suggestions.some((sugg) => sugg.label.toLowerCase() === fieldName.toLowerCase())

      if (!found) {
        erros.push('not-exists-field-error')
      }
    })

    return erros
  }
}