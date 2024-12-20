const isExistenceOperator = (operator) => ['exists', 'does_not_exist'].includes(operator)

const processCriteria = (criteria) => {
  if (!isExistenceOperator(criteria.operator)) {
    return criteria
  }

  // eslint-disable-next-line no-unused-vars
  const { argument, ...processedCriteria } = criteria
  return processedCriteria
}

export const adaptCriteria = (criterias) => {
  return criterias.map(criteriaArray => {
    return criteriaArray.map(processCriteria)
  })
}
