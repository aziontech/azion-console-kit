/**
 * Enriquecer uma lista com dados de referência vindos de requisições paginadas.
 *
 * @param {Array} items Lista de itens a serem enriquecidos
 * @param {Function} fetchReferencePage Função async que recebe ({ page, pageSize }) e retorna { results }
 * @param {Function} getReferenceId Função que extrai o ID de referência do item
 * @param {Function} merge Função que combina o item original com o valor enriquecido
 * @param {Object} options Configurações opcionais como pageSize e fields
 * @returns {Promise<Array>} Lista enriquecida
 */
export const enrichByMatchingReference = async (
  items,
  fetchReferencePage,
  getReferenceId,
  merge,
  { pageSize = 100, fields = 'id,name' } = {}
) => {
  const unresolvedIds = new Set(items.map((item) => item.id))
  const enriched = []
  const referenceMap = new Map()

  let page = 1

  while (unresolvedIds.size > 0) {
    const { results } = await fetchReferencePage({ page, pageSize, fields })

    if (!results?.length) break

    results.forEach((ref) => referenceMap.set(ref.id, ref))

    for (const item of items) {
      const refId = getReferenceId(item)

      if (unresolvedIds.has(item.id) && referenceMap.has(refId)) {
        enriched.push(merge(item, referenceMap.get(refId)))
        unresolvedIds.delete(item.id)
      }
    }

    if (results.length < pageSize) break
    page++
  }

  return enriched
}
