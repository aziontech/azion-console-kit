export default class Aql {
  constructor() {
    // Inicializações se necessário
  }

  parse(query, suggestions, domains) {
    const expressions = query.split(/and/i).map((exp) => exp.trim())

    const output = expressions
      .map((exp) => {
        const regex =
          /^(?:"([^"]+)"|'([^']+)'|([\w\s]+))\s+(=|>|<|>=|<=|BETWEEN|<>|LIKE|ILIKE|IN)\s+(.+)$/i
        const match = exp.match(regex)
        if (match) {
          let field = match[1] || match[2] || match[3]
          field = field.trim()

          const suggestion = suggestions.find(
            (item) => item.label.toLowerCase() === field.toLowerCase()
          )
          if (suggestion) {
            field = suggestion.label
          }

          let operator = match[4]
          let value = match[5].trim()

          const operatorInfo = this.operatorInfo(
            suggestion.value.operator,
            this.mapOperatorValue(operator)
          )

          if (operator.toUpperCase() === 'BETWEEN') {
            const values = value.split(/\s+and\s+/i)
            if (values.length === 2) {
              let val1, val2
              if (suggestion && suggestion.value.type.toLowerCase() === 'int') {
                val1 = Number(values[0].trim())
                val2 = Number(values[1].trim())
              } else {
                val1 = values[0].replace(/^["']|["']$/g, '').trim()
                val2 = values[1].replace(/^["']|["']$/g, '').trim()
              }
              return {
                field: field,
                value: [val1, val2],
                operator: operatorInfo.value,
                valueField: this.formatFieldName(field),
                type: operatorInfo.type ?? 'Int'
              }
            }
          }

          let parsedValue
          if (suggestion && operatorInfo.type.toLowerCase() === 'int') {
            parsedValue = Number(value)
          } else if (operator.toUpperCase() === 'IN' && field.toLowerCase() === 'domain') {
            parsedValue = this.formatDomainValues(query, domains)
          } else {
            parsedValue = value.replace(/^["']|["']$/g, '')
          }

          return {
            field: field,
            value: parsedValue,
            operator: operatorInfo.value,
            valueField: this.formatFieldName(field),
            type: operatorInfo.type ?? 'Int'
          }
        }
        return null
      })
      .filter((item) => item !== null)

    return output
  }

  formatFieldName(field) {
    if (field.toLowerCase() === 'domain') return 'configurationId'
    const parts = field.split(' ')
    if (parts) {
      return parts
        .map((part, index) =>
          index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1)
        )
        .join('')
    }
    return field
  }

  formatDomainValues(query, domains) {
    const parenMatch = query.match(/\(([^)]+)\)/)
    if (!parenMatch) return []

    const tokens = parenMatch[1]
      .split(',')
      .map((token) => token.trim())
      .filter((token) => token !== '')

    const result = tokens
      .map((token) => {
        const found = domains.find((domain) => domain?.label?.toLowerCase() === token.toLowerCase())
        return found ? { label: found.label, value: found.id } : null
      })
      .filter((item) => item !== null)

    return result
  }

  operatorInfo(operators, operator) {
    return operators.find((op) => op.label === operator)?.value
  }

  mapOperatorValue(op) {
    switch (op) {
      case 'in':
        return 'In'
      case '=':
        return 'Equals'
      case '<>':
        return 'Not Equals'
      case 'like':
        return 'Contains'
      case 'ilike':
        return 'Not Contains'
      case 'between':
        return 'Between'
      case '<':
        return 'Less Than'
      case '<=':
        return 'Less Than or Equal'
      case '>':
        return 'Greater Than'
      case '>=':
        return 'Greater Than or Equal'
      default:
        return op
    }
  }

  selectSuggestion(suggestion, query, step, fieldName) {
    if (step === 'field') {
      let newQuery
      if (query?.toLowerCase().includes(' and ')) {
        const parts = query.split(/\s+and\s+/i)
        let newField = suggestion.label.toLowerCase()
        if (newField.includes(' ')) {
          newField = `"${newField}"`
        }
        parts[parts.length - 1] = newField
        newQuery = parts.join(' and ') + ' '
        return {
          query: `${newQuery} `,
          nextStep: 'operator',
          label: suggestion.label.toLowerCase()
        }
      } else {
        let newField = suggestion.label.toLowerCase()
        if (newField.includes(' ')) {
          newQuery = `"${newField}"`
          return {
            query: `${newQuery} `,
            nextStep: 'operator',
            label: suggestion.label.toLowerCase()
          }
        } else {
          return {
            query: `${newField} `,
            nextStep: 'operator',
            label: suggestion.label.toLowerCase()
          }
        }
      }
    } else if (step === 'operator') {
      const newQuery = `${query} ${suggestion.label} `
      return { query: newQuery, nextStep: 'value', label: fieldName }
    } else if (step === 'value') {
      let newQuery
      if (fieldName === 'domain') {
        if (query.endsWith(' ')) {
          newQuery = `(${suggestion.label})`
          return { query: `${query} ${newQuery}`, nextStep: 'value', label: fieldName }
        } else if (query.endsWith(')')) {
          let match = query.match(/\(([^)]+)\)/)
          if (match) {
            let domains = match[1]
            domains += `, ${suggestion.label}`

            newQuery = query.replace(/\(([^)]+)\)/, `(${domains})`)
            return { query: `${newQuery}`, nextStep: 'value', label: fieldName }
          }
        }
      } else {
        return { query: `${suggestion} `, nextStep: 'value', label: fieldName }
      }
    } else if (step === 'logicOperator') {
      const newQuery = `${query} ${suggestion.label} `

      return { query: newQuery, nextStep: 'field', label: fieldName }
    }
  }

  handleInputMatching(query, suggestions) {
    const operadores = ['=', '<>', '<', '>', '<=', '>=', 'like', 'ilike', 'between', 'in']
    const parts = query.split(/\s+and\s+/i)
    const tokenRaw = parts.pop().trim()
    const tokenForMatch = tokenRaw.replace(/^["']|["']$/g, '').toLowerCase()
    const fieldComplete = query.endsWith(' ')

    const matchingFields = suggestions.filter((item) =>
      item.label.toLowerCase().startsWith(tokenForMatch)
    )
    let operatorFound = operadores.find((op) => tokenForMatch.toLowerCase().includes(op))

    const hasValueAfterOperator = operatorFound ? tokenRaw.split(operatorFound)[1] : null

    if (matchingFields.length === 1) {
      const matchedField = matchingFields[0]

      if (matchedField.label.includes(' ')) {
        const tokenIsComplete =
          (tokenRaw.startsWith('"') && tokenRaw.endsWith('"')) ||
          (tokenRaw.startsWith("'") && tokenRaw.endsWith("'"))

        if (fieldComplete && tokenIsComplete) {
          return { operator: 'operator', selectedField: matchedField.label.toLowerCase() }
        }
      } else {
        if (fieldComplete && tokenForMatch === matchedField.label.toLowerCase()) {
          return { operator: 'operator', selectedField: matchedField.label.toLowerCase() }
        }
      }
    } else if (operatorFound && operatorFound === 'in') {
      return { operator: 'value', selectedField: operatorFound === 'in' ? 'domain' : '' }
    } else if (tokenForMatch && hasValueAfterOperator && query.endsWith(' ')) {
      return { operator: 'logicOperator', selectedField: '' }
    }
    return { operator: 'field', selectedField: '' }
  }

  queryValidator(query, suggestions) {
    const hasErrorInCompoundFields = this.queryValidationForCompoundFields(query)
    const hasErrorInFields = this.queryValidationIfFieldsExistInList(query, suggestions)
    const hasErrorInOperatorIn = this.queryValidationForInOperator(query, suggestions)

    return [...hasErrorInCompoundFields, ...hasErrorInFields, ...hasErrorInOperatorIn]
  }

  queryValidationForCompoundFields(queryText) {
    let erros = []
    const operadores = ['=', '<>', '<', '>', '<=', '>=', 'like', 'ilike', 'between', 'in']
    if (!queryText) return []
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

    if (!query?.includes('and') && !query?.includes(' ')) return []

    const expressions = query?.split(/\s+and\s+/i)

    expressions.forEach((expression) => {
      if (!expression || !expression.endsWith(' ')) return
      const operatorFound = operadores.find((op) =>
        new RegExp(`(^|\\s)${op}(?=\\s)`, 'i').test(expression)
      )

      let fieldPart
      if (operatorFound) {
        const regex = new RegExp(`^(.*?)\\s+${operatorFound}\\s+`, 'i')
        const match = expression.match(regex)
        if (match) {
          fieldPart = match[1].trim()
        } else {
          fieldPart = expression.trim()
        }
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

  queryValidationForInOperator(queryText) {
    let errors = []
    // Se a query não contém o operador in, não há nada para validar
    if (!/\bin\b/i.test(queryText) || queryText.endsWith(' ') || queryText.endsWith('and'))
      return errors

    // Divide a query por "and" (ignorando caixa) para validar cada expressão individualmente
    const expressions = queryText.split(/\s+and\s+/i)

    expressions.forEach((expression) => {
      // Se a expressão não contém o operador in (como palavra inteira), ignora
      if (!/\bin\b/i.test(expression)) return

      // Extrai a parte que vem após o operador "in".
      // A regex abaixo captura tudo que vem depois de "in", ignorando espaços:
      const regex = /\bin\b\s*(.+)$/i
      const match = expression.match(regex)
      if (match) {
        let valuePart = match[1].trim() // Ex: "(domain1, domain2)" ou possivelmente "domain1, domain2"

        // Validação 1: Os valores precisam estar entre parênteses.
        if (!(valuePart.startsWith('(') && valuePart.endsWith(')'))) {
          if (!errors.includes('in-operator-parentheses-error')) {
            errors.push('in-operator-parentheses-error')
          }
        } else {
          // Remove os parênteses e espaços internos
          const inner = valuePart.slice(1, -1).trim()
          // Validação 2: Verifica se há vírgula extra no final.
          // Se o conteúdo interno termina com vírgula, é erro.
          if (inner.endsWith(',')) {
            if (!errors.includes('in-operator-trailing-comma-error')) {
              errors.push('in-operator-trailing-comma-error')
            }
          }
          // Opcional: Você pode também verificar se cada valor está presente
          // e não vazio, por exemplo:
          const values = inner.split(',').map((val) => val.trim())
          if (values.some((val) => val === '')) {
            if (!errors.includes('in-operator-empty-value-error')) {
              errors.push('in-operator-empty-value-error')
            }
          }
        }
      }
    })

    return errors
  }
}
