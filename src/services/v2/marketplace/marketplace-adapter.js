export const MarketplaceAdapter = {
  transformListItem(item) {
    return {
      id: String(item.id),
      name: item.name,
      referenceId: item.solution_reference_id,
      vendor: item.vendor,
      slug: item.slug,
      headline: item.headline,
      icon: item.icon,
      featured: item.featured,
      released: item.new_release,
      instanceType: {
        name: item.instance_type?.name,
        isTemplate: item.instance_type?.is_template
      },
      category: item.category?.[0]?.name,
      updatedAt: item.updated_at,
      latestVersion: item.latest_version
    }
  },

  transformList(data) {
    if (!Array.isArray(data)) return []

    const results = data.map((item) => this.transformListItem(item))
    results.sort((itemA, itemB) => itemA.name.localeCompare(itemB.name))

    return results
  },

  transformCategories(data) {
    if (!Array.isArray(data)) return []

    return data.map((item) => ({
      name: item.name,
      slug: item.slug,
      solutionsCount: item.solutions_count
    }))
  }
}
