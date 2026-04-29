/* eslint-disable no-console */
import { OPERATOR_MAPPING_ADVANCED_FILTER } from '@/templates/advanced-filter/component/index.js'
import { TEXT_DOMAIN_WORKLOAD } from '@/helpers'

export default class Aql {
  constructor() {
    this.operators = ['<=', '>=', '=', '<>', '<', '>', 'like', 'ilike', 'between', 'in']
    this.handleTextDomainWorkload = TEXT_DOMAIN_WORKLOAD()
  }

  buildOperatorsRegex() {
    const patterns = this.operators.map((op) => {
      const escaped = op.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')
      return /^[a-zA-Z]+$/.test(op) ? `\\b${escaped}\\b` : escaped
    })

    return new RegExp(patterns.join('|'), 'i')
  }

  #isDomainWorkloadField(fieldName) {
    if (!fieldName) return false
    return String(fieldName).toLowerCase() === this.handleTextDomainWorkload.singularLabel
  }

  normalizeQuery(query) {
    if (!query) return query

    return query.replace(/\b(in|between)\b\s*\(/gi, (match, op) => `${op} (`).replace(/\(\s+/g, '(')
  }

  parse(query, suggestions, domains) {
    if (!query) return []
    const normalizedQuery = this.normalizeQuery(query)
    const expressions = normalizedQuery.split(/and/i).map((expr) => expr.trim())
    const expressionRegex =
      /^(?:"([^"]+)"|'([^']+)'|([\w\s]+))\s+(=|>|<|>=|<=|BETWEEN|<>|LIKE|ILIKE|IN)\s+(.+)$/i

    const parsedExpressions = expressions
      .map((expr) => {
        // Strip leading/trailing grouping parentheses that are not part of IN/BETWEEN values
        let cleanExpr = expr
        if (cleanExpr.startsWith('(') && !/\bin\b/i.test(cleanExpr) && !/\bbetween\b/i.test(cleanExpr)) {
          cleanExpr = cleanExpr.replace(/^\(+/, '')
        }
        if (cleanExpr.endsWith(')') && !/\bin\b/i.test(cleanExpr) && !/\bbetween\b/i.test(cleanExpr)) {
          cleanExpr = cleanExpr.replace(/\)+$/, '')
        }
        cleanExpr = cleanExpr.trim()

        const match = cleanExpr.match(expressionRegex)
        if (!match) return null

        let field = (match[1] || match[2] || match[3]).trim()

        const suggestion = suggestions.find(
          (item) => item.label.toLowerCase() === field.toLowerCase()
        )
        if (suggestion) {
          field = suggestion.label
        }

        let operator = match[4]
        let value = match[5].trim()

        const mappedOperator = this.mapOperatorValue(operator)
        const operatorInfo = this.operatorInfo(suggestion?.value?.operator, mappedOperator)

        if (operator.toUpperCase() === 'BETWEEN') {
          const [begin, end] = value
            .replace(/[()]/g, '')
            .split(',')
            .map((val) => val.trim())
          let beginValue = begin
          let endValue = end

          if (operatorInfo?.type === 'IntRange') {
            beginValue = parseInt(begin, 10)
            endValue = parseInt(end, 10)
          } else if (operatorInfo?.type === 'FloatRange') {
            beginValue = parseFloat(begin)
            endValue = parseFloat(end)
          }

          return {
            field: field,
            value: { begin: beginValue, end: endValue },
            operator: operatorInfo?.value,
            valueField: this.convertFieldToCamelCase(field),
            type: operatorInfo?.type || 'Int'
          }
        }

        let parsedValue
        if (suggestion && operatorInfo?.type?.toLowerCase() === 'int') {
          parsedValue = Number(value)
        } else if (
          operator.toUpperCase() === 'IN' &&
          field.toLowerCase() === this.handleTextDomainWorkload.singularLabel
        ) {
          parsedValue = this.formatDomainValues(normalizedQuery, domains)
        } else {
          parsedValue = value.replace(/^["']|["']$/g, '')
        }

        return {
          field: field,
          value: parsedValue,
          operator: operatorInfo?.value,
          valueField: this.convertFieldToCamelCase(field),
          type: operatorInfo?.type || 'Int'
        }
      })
      .filter((item) => item !== null)

    return parsedExpressions
  }

  convertFieldToCamelCase(field) {
    if (!field) return field

    const normalizedField = field.trim()

    if (normalizedField.toLowerCase() === this.handleTextDomainWorkload.singularLabel)
      return 'configurationId'

    const words = normalizedField.split(/\s+/)

    return words
      .map((word, index) => (index === 0 ? word.toLowerCase() : this.capitalizeFirstLetter(word)))
      .join('')
  }

  capitalizeFirstLetter(word) {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }

  formatDomainValues(query, domains) {
    const extractDomainClauseContent = (query) => {
      const lowerQuery = query.toLowerCase()
      const escapedField = this.handleTextDomainWorkload.singularLabel.replace(
        /[.*+?^${}()|[\]\\]/g,
        '\\$&'
      )
      const clauseRegex = new RegExp(`\\b${escapedField}\\b\\s+in\\s*\\(`, 'i')
      const match = clauseRegex.exec(lowerQuery)
      if (!match) return null

      const startIndex = query.indexOf('(', match.index)
      if (startIndex === -1) return null

      let counter = 0
      let endIndex = -1
      let inQuotes = false
      let quoteChar = ''
      // eslint-disable-next-line id-length
      for (let i = startIndex; i < query.length; i++) {
        const ch = query[i]
        if ((ch === '"' || ch === "'")) {
          if (!inQuotes) { inQuotes = true; quoteChar = ch }
          else if (ch === quoteChar) { inQuotes = false; quoteChar = '' }
        }
        if (!inQuotes) {
          if (ch === '(') counter++
          else if (ch === ')') {
            counter--
            if (counter === 0) { endIndex = i; break }
          }
        }
      }
      if (endIndex === -1) {
        return query.substring(startIndex + 1)
      }
      return query.substring(startIndex + 1, endIndex)
    }

    const splitByCommaNotInParens = (str) => {
      const tokens = []
      let token = ''
      let nesting = 0
      let inQuotes = false
      let quoteChar = ''
      // eslint-disable-next-line id-length
      for (let i = 0; i < str.length; i++) {
        const char = str[i]
        if ((char === '"' || char === "'") && nesting === 0) {
          if (!inQuotes) { inQuotes = true; quoteChar = char }
          else if (char === quoteChar) { inQuotes = false; quoteChar = '' }
          // Don't add quote chars to token
          continue
        }
        if (char === ',' && nesting === 0 && !inQuotes) {
          const cleaned = token.trim()
          if (cleaned.length > 0) tokens.push(cleaned)
          token = ''
        } else {
          token += char
          if (char === '(' && !inQuotes) nesting++
          else if (char === ')' && !inQuotes) nesting--
        }
      }
      if (token.trim().length > 0) {
        tokens.push(token.trim())
      }
      return tokens
    }

    const domainClauseContent = extractDomainClauseContent(query)
    if (!domainClauseContent) return []

    const tokens = splitByCommaNotInParens(domainClauseContent)

    const result = tokens
      .map((token) => {
        const found = domains.find((domain) => domain?.label?.toLowerCase() === token.toLowerCase())
        return found ? { label: found.label, value: found.id } : null
      })
      .filter((item) => item !== null)

    return result
  }

  upsertInListValue(query, valueToAdd) {
    if (!query) return query
    const value = String(valueToAdd ?? '').trim()
    if (!value) return query

    // Find the opening paren of the IN clause (not one inside a quoted value)
    let startIndex = -1
    let inQ = false
    let qc = ''
    for (let idx = query.length - 1; idx >= 0; idx--) {
      const ch = query[idx]
      if ((ch === '"' || ch === "'")) {
        if (!inQ) { inQ = true; qc = ch } else if (ch === qc) { inQ = false; qc = '' }
      }
      if (ch === '(' && !inQ) { startIndex = idx; break }
    }

    if (startIndex === -1) {
      const trimmed = query.trimEnd()
      const needsQuote = value.includes(',') || value.includes('(') || value.includes(')')
      const quoted = needsQuote ? '"' + value + '"' : value
      return trimmed + ' (' + quoted + ')'
    }

    // Find matching close paren
    let endIndex = -1
    let counter = 0
    inQ = false; qc = ''
    for (let idx = startIndex; idx < query.length; idx++) {
      const ch = query[idx]
      if ((ch === '"' || ch === "'")) {
        if (!inQ) { inQ = true; qc = ch } else if (ch === qc) { inQ = false; qc = '' }
      }
      if (!inQ) {
        if (ch === '(') counter++
        else if (ch === ')') { counter--; if (counter === 0) { endIndex = idx; break } }
      }
    }

    const innerRaw = query.slice(startIndex + 1, endIndex === -1 ? query.length : endIndex)

    // Split by comma respecting quotes
    const tokens = []
    let tok = ''
    let tInQ = false
    let tQc = ''
    for (let idx = 0; idx < innerRaw.length; idx++) {
      const ch = innerRaw[idx]
      if ((ch === '"' || ch === "'")) {
        if (!tInQ) { tInQ = true; tQc = ch } else if (ch === tQc) { tInQ = false; tQc = '' }
        continue // strip quotes
      }
      if (ch === ',' && !tInQ) {
        const cleaned = tok.trim()
        if (cleaned.length > 0) tokens.push(cleaned)
        tok = ''
      } else {
        tok += ch
      }
    }
    if (tok.trim().length > 0) tokens.push(tok.trim())

    const alreadyExists = tokens.some((token) => token.toLowerCase() === value.toLowerCase())
    if (!alreadyExists) tokens.push(value)

    // Rebuild with quotes for values containing special chars
    const quoted = tokens.map((token) => {
      if (token.includes(',') || token.includes('(') || token.includes(')') || token.includes(' ')) return '"' + token + '"'
      return token
    })
    const rebuiltInner = quoted.join(', ')
    const prefix = query.slice(0, startIndex + 1)

    if (endIndex === -1) return prefix + rebuiltInner + ')'
    const suffix = query.slice(endIndex)
    return prefix + rebuiltInner + suffix
  }

  operatorInfo(operators, operator) {
    if (!operators) return undefined
    return operators.find((op) => op.label === operator)?.value
  }

  mapOperatorValue(op) {
    if (typeof op === 'string' && /^[a-zA-Z]+$/.test(op)) {
      op = op.toLowerCase()
    }

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
    const suggestionLabel = suggestion.label.toLowerCase()

    const formatField = (field) => {
      return field.includes(' ') ? `"${field}"` : field
    }

    switch (step) {
      case 'field': {
        const formattedField = formatField(suggestionLabel)
        if (query && query.toLowerCase().includes(' and ')) {
          const parts = query.split(/\s+and\s+/i)
          parts[parts.length - 1] = formattedField
          const newQuery = parts.join(' and ') + ' '
          return { query: newQuery, nextStep: 'operator', label: suggestionLabel }
        } else {
          const newQuery = `${formattedField} `
          return { query: newQuery, nextStep: 'operator', label: suggestionLabel }
        }
      }
      case 'operator': {
        const newQuery = `${query.trimEnd()} ${suggestionLabel} `
        return { query: newQuery, nextStep: 'value', label: fieldName }
      }
      case 'value': {
        if (this.#isDomainWorkloadField(fieldName)) {
          const value = suggestionLabel.trim()
          const newQuery = this.upsertInListValue(query, value)
          return { query: newQuery, nextStep: 'value', label: fieldName }
        } else {
          return { query: `${suggestionLabel} `, nextStep: 'value', label: fieldName }
        }
      }
      case 'logicOperator': {
        const newQuery = `${query} ${suggestionLabel} `
        return { query: newQuery, nextStep: 'field', label: fieldName }
      }
      default:
        return { query, nextStep: step, label: fieldName }
    }
  }

  handleInputMatching(query, suggestions) {
    const parts = query.split(/\s+and\s+/i)
    const tokenRaw = parts.pop().trim()
    const tokenForMatch = tokenRaw.replace(/^["']|["']$/g, '').toLowerCase()
    const fieldComplete = query.endsWith(' ')

    const matchingFields = suggestions.filter((item) =>
      item.label.toLowerCase().startsWith(tokenForMatch)
    )
    const sortedOperators = [...this.operators].sort((left, right) => right.length - left.length)
    let operatorFound = sortedOperators.find((op) => {
      const escaped = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = /^[a-zA-Z]+$/.test(op) ? `\\b${escaped}\\b` : escaped
      return new RegExp(pattern, 'i').test(tokenForMatch)
    })

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
      if (query.endsWith(') ')) {
        return { operator: 'logicOperator', selectedField: '' }
      }
      return {
        operator: 'value',
        selectedField: operatorFound === 'in' ? this.handleTextDomainWorkload.singularLabel : ''
      }
    } else if (tokenForMatch && hasValueAfterOperator && query.endsWith(' ')) {
      return { operator: 'logicOperator', selectedField: '' }
    }
    return { operator: 'field', selectedField: '' }
  }

  handleInicialQuery(filters, fieldsInFilter) {
    if (!filters || !filters.length || !fieldsInFilter.length) return ''

    const conditions = filters.map((filter) => {
      const operator = OPERATOR_MAPPING_ADVANCED_FILTER[filter.operator]?.format
      const matchedField = fieldsInFilter.find((field) => field.value === filter.valueField)

      if (!operator) {
        console.error(`invalid operator "${filter.operator}"`)
        return ''
      }
      if (!matchedField) {
        console.error(
          `we could not find the field corresponding to your selection ("${filter.valueField}")`
        )
        return ''
      }
      const fieldLowerCase = matchedField.label.toLowerCase()
      const formattedField = fieldLowerCase.includes(' ') ? `'${fieldLowerCase}'` : fieldLowerCase

      if (operator === 'between') {
        return `${formattedField} ${operator} (${filter.value.begin}, ${filter.value.end})`
      } else if (operator === 'in') {
        const values = filter.value
          .map((item) => {
            const label = String(item.label || item.value || item)
            // Wrap in quotes if the value contains special characters
            if (label.includes(',') || label.includes('(') || label.includes(')') || label.includes(' ')) {
              return `"${label}"`
            }
            return label
          })
          .join(', ')
        return `${formattedField} ${operator} (${values})`
      }

      return `${formattedField} ${operator} ${filter.value}`
    })

    return conditions.join(' AND ')
  }

  queryValidator(query, suggestions) {
    const normalizedQuery = this.normalizeQuery(query)
    const hasErrorInCompoundFields = this.queryValidationForCompoundFields(query)
    const hasErrorInFields = this.queryValidationIfFieldsExistInList(normalizedQuery, suggestions)
    const hasErrorInOperatorIn = this.queryValidationForInOperator(normalizedQuery, suggestions)
    const hasErrorNotSpace = this.queryValidatorNoSpaces(normalizedQuery)
    const hasErrorBetweenOperator = this.queryValidatorBetweenOperators(normalizedQuery)

    const erros = [
      ...hasErrorInCompoundFields,
      ...hasErrorInFields,
      ...hasErrorInOperatorIn,
      ...hasErrorNotSpace,
      ...hasErrorBetweenOperator
    ]

    const errorMessages = {
      'quote-error': 'composite fields must be included in quotes. e.g: "Upstream Status".',
      'not-exists-field-error':
        'some provided fields do not match the currently available ones. Please, check and try again.',
      'in-operator-parentheses-error':
        "there are fields with 'in' operator that need to be inside parentheses. Please, check and try again. e.g: domain in (domain1, domain2)",
      'in-operator-trailing-comma-error':
        "fields with 'in' operator that need the comma removed at the end of the values in parentheses. Please, check and try again.",
      'no-space-error':
        'please add spaces between the field, operator, and value. For example, write "status = 200" instead of "status=200".',
      'between-operator-error':
        'The BETWEEN operator requires its values to be enclosed in parentheses. For example: status between (200, 300).',
      'between-operator-error-three-values':
        'The BETWEEN operator must have exactly two values. For example: status between (200, 300).',
      'between-operator-error-not-parentheses':
        'Please enclose the values for the BETWEEN operator in parentheses. For example: status between (200, 300).',
      'between-operator-error-equal-values':
        'The two values for the BETWEEN operator must be different. For example: status between (200, 300).'
    }

    return erros.map((errorCode) => errorMessages[errorCode]).filter((msg) => !!msg)
  }

  queryValidationForCompoundFields(queryText) {
    let erros = []
    if (!queryText) return []

    const stripGroupingParens = (str) => str.replace(/^\(+\s*/, '').replace(/\s*\)+$/, '').trim()
    const escapedOperatorsRegex = this.buildOperatorsRegex()

    if (queryText.toLowerCase().includes('and')) {
      const expressions = queryText.split(/\s+and\s+/i)
      expressions.forEach((expression) => {
        const cleaned = stripGroupingParens(expression)
        let match = cleaned.toLowerCase().match(escapedOperatorsRegex)
        let operatorFound = match ? match[0] : null
        if (operatorFound) {
          let stringBeforeOperator = cleaned.split(operatorFound)[0].trim()
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
          if (cleaned.includes(' ') && /\s+\S+/.test(cleaned)) {
            if (
              !(
                (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
                (cleaned.startsWith("'") && cleaned.endsWith("'"))
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
      const cleaned = stripGroupingParens(queryText)
      let match = cleaned.toLowerCase().match(escapedOperatorsRegex)
      let operatorFound = match ? match[0] : null
      if (operatorFound) {
        let stringBeforeOperator = cleaned.split(operatorFound)[0].trim()
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
        if (cleaned.includes(' ') && /\s+\S+/.test(cleaned)) {
          if (
            !(
              (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
              (cleaned.startsWith("'") && cleaned.endsWith("'"))
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

    if (!query?.includes('and') && !query?.includes(' ')) return []

    const expressions = query?.split(/\s+and\s+/i)
    if (!expressions) return []

    expressions.forEach((expression) => {
      if (!expression || !expression.endsWith(' ')) return
      // Strip grouping parentheses before extracting the field name
      const cleaned = expression.replace(/^\(+\s*/, '').replace(/\s*\)+$/, '').trim()
      if (!cleaned) return

      const operatorFound = this.operators.find((op) =>
        new RegExp(`(^|\\s)${op}(?=\\s)`, 'i').test(cleaned)
      )

      let fieldPart
      if (operatorFound) {
        const regex = new RegExp(`^(.*?)\\s+${operatorFound}\\s+`, 'i')
        const match = cleaned.match(regex)
        if (match) {
          fieldPart = match[1].trim()
        } else {
          fieldPart = cleaned.trim()
        }
      } else {
        fieldPart = cleaned.trim()
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
    if (!expressions) return []

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

  queryValidatorNoSpaces(query) {
    const expressions = query?.split(/and/i).map((exp) => exp.trim())
    if (!expressions) return []
    const errors = []

    // eslint-disable-next-line id-length
    const sortedOperators = [...this.operators].sort((a, b) => b.length - a.length)
    const escapedOperators = sortedOperators.map((op) => {
      const opEscaped = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      return /^[a-zA-Z]+$/.test(op) ? `\\b${opEscaped}\\b` : opEscaped
    })
    const operatorPattern = escapedOperators.join('|')
    const regex = new RegExp(operatorPattern, 'g')

    expressions.forEach((exp) => {
      let match
      while ((match = regex.exec(exp)) !== null) {
        const start = match.index
        const op = match[0]
        const end = start + op.length
        const beforeChar = start === 0 ? ' ' : exp[start - 1]
        const afterChar = end >= exp.length ? ' ' : exp[end]

        if (!/\s/.test(beforeChar) || !/\s/.test(afterChar)) {
          if (!errors.includes('no-space-error')) {
            errors.push('no-space-error')
          }
          break
        }
      }
    })

    return errors
  }

  queryValidatorBetweenOperators(query) {
    const expressions = query.split(/and/i).map((exp) => exp.trim())
    if (!expressions) return []
    const errors = []

    expressions.forEach((expression) => {
      if (/between/i.test(expression)) {
        const betweenMatch = expression.match(/between\s*\(([^)]+)\)/i)
        if (betweenMatch) {
          const extractedBetweenContent = betweenMatch[1]
          const betweenValues = extractedBetweenContent.split(',').map((val) => val.trim())

          if (betweenValues.length > 2) {
            if (!errors.includes('between-operator-error-three-values')) {
              errors.push('between-operator-error-three-values')
            }
          } else if (betweenValues.length === 1 || betweenValues.some((val) => val === '')) {
            if (!errors.includes('between-operator-error')) {
              errors.push('between-operator-error')
            }
          } else if (betweenValues[0] === betweenValues[1]) {
            if (!errors.includes('between-operator-error-equal-values')) {
              errors.push('between-operator-error-equal-values')
            }
          }
        } else {
          if (!errors.includes('between-operator-error-not-parentheses')) {
            errors.push('between-operator-error-not-parentheses')
          }
        }
      }
    })

    return errors
  }

  highlightQuerySyntax(query) {
    const parts = query.split(/(\band\b)/gi)

    const highlightedParts = parts.map((part) => {
      if (/^\band\b$/i.test(part.trim())) {
        return `<span style="color: var(--series-six-color);">${part.trim()}</span>`
      } else {
        return part.replace(
          /((?:"[^"]+"|\S+))(\s*)(<=|>=|<>|=|<|>|like|ilike|between|\bin\b)/gi,
          (match, field, space, operator) => {
            return `<span style="color: var(--series-three-color);">${field}</span> <span style="color: var(--series-two-color);">${operator}</span>`
          }
        )
      }
    })

    return highlightedParts.join('')
  }

  saveCursorPosition(element) {
    let caretOffset = 0
    const selection = window.getSelection()
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(element)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      caretOffset = preCaretRange.toString().length
    }

    return caretOffset
  }

  restoreCursorPosition(element, offset) {
    if (!element) return

    const range = document.createRange()
    const selection = window.getSelection()
    let currentOffset = 0
    let found = false

    function traverse(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const nextOffset = currentOffset + node.textContent.length
        if (nextOffset >= offset) {
          range.setStart(node, offset - currentOffset)
          range.collapse(true)
          found = true
        } else {
          currentOffset = nextOffset
        }
      } else {
        for (let interable = 0; interable < node.childNodes.length; interable++) {
          traverse(node.childNodes[interable])
          if (found) break
        }
      }
    }

    traverse(element)

    if (!found) {
      range.selectNodeContents(element)
      range.collapse(false)
    }

    selection.removeAllRanges()
    selection.addRange(range)
  }

  positionCursorAtEndOfElement = (element) => {
    if (!element) return
    element.focus()

    if (window.getSelection && document.createRange) {
      const range = document.createRange()
      range.selectNodeContents(element)
      range.collapse(false)

      const selection = window.getSelection()
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
    } else if (document.body.createTextRange) {
      // Support for older versions of IE
      const textRange = document.body.createTextRange()
      textRange.moveToElementText(element)
      textRange.collapse(false)
      textRange.select()
    }
  }

  getOperatorSuggestions = (query, suggestions, selectedFieldName) => {
    const selectedField = suggestions.find(
      (item) => item.value.label.toLowerCase() === selectedFieldName.toLowerCase()
    )
    if (!selectedField) return []

    const fieldRegex = new RegExp(
      `${selectedField.label}\\s+(=|<>|<|>|<=|>=|like|ilike|between)`,
      'i'
    )
    const operatorMatch = query.match(fieldRegex)
    const operatorAlreadyTyped = operatorMatch ? operatorMatch[1].toLowerCase() : null

    return selectedField.value.operator
      .filter((op) => {
        if (op.value.format.toLowerCase() === 'in') return true
        if (operatorAlreadyTyped && op.value.format.toLowerCase() === operatorAlreadyTyped) {
          return false
        }
        return true
      })
      .map((op) => ({
        label: op.value.format
      }))
  }

  getValueSuggestions(domains, selectedFieldName) {
    if (this.#isDomainWorkloadField(selectedFieldName)) {
      return domains
    }
    return []
  }

  getFieldSuggestions(query, suggestions) {
    const parts = query.split(/\s+and\s+/i)
    const currentFieldToken = parts.pop().trim().replace(/["']/g, '')

    const searchTerm = currentFieldToken.toLowerCase()

    if (!searchTerm) return suggestions

    return suggestions.filter((item) => item.label.toLowerCase().startsWith(searchTerm))
  }
}
