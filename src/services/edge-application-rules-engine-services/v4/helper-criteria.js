export const adaptCriteria = (criterias) => {
    return criterias.map(criteriaArray => {
        return criteriaArray.map(criteria => {
            if (criteria.operator === 'exists' || criteria.operator === 'does_not_exist') {
                // eslint-disable-next-line no-unused-vars
                const { argument, ...rest } = criteria
                return rest
            } else {
                return criteria
            }
        })
    })
}
