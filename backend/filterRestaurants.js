function applyFilters(data, filters) {
  let results = data.filter((r) => {
    const cuisineMatch =
      !filters.cuisines || filters.cuisines.length === 0 ||
      filters.cuisines.some(c =>
        r.cuisine.toLowerCase().includes(c.toLowerCase()) ||
        r.all_cuisines.toLowerCase().includes(c.toLowerCase())
      )
    const priceMatch = filters.max_price === 0 || r.price_for_two <= filters.max_price
    const ratingMatch = filters.min_rating === 0 || r.rating >= filters.min_rating
    const vegMatch = !filters.veg_only || r.veg_only === true

    return cuisineMatch && priceMatch && ratingMatch && vegMatch
  })

  if (filters.sort_by === 'rating') {
    results.sort((a, b) => b.rating - a.rating)
  } else if (filters.sort_by === 'price') {
    results.sort((a, b) => a.price_for_two - b.price_for_two)
  }

  return results
}

export function filterRestaurants(data, filters) {
  const strictResults = applyFilters(data, filters)
  if (strictResults.length > 0) {
    return { results: strictResults, relaxed: false, droppedFilters: [] }
  }

  // Guardrail: try dropping ONE filter at a time, independently, each starting
  // fresh from the original filters - never combine relaxations silently.
  // This guarantees the notice we show is always fully honest about what changed.
  const relaxOrder = ['min_rating', 'max_price', 'cuisines']

  for (const key of relaxOrder) {
    const testFilters = { ...filters }
    if (key === 'cuisines') testFilters.cuisines = []
    else testFilters[key] = 0

    const relaxedResults = applyFilters(data, testFilters)
    if (relaxedResults.length > 0) {
      return { results: relaxedResults, relaxed: true, droppedFilters: [key] }
    }
  }

  // Last resort: no single relaxation worked. Try dropping all of them together,
  // but be explicit that MULTIPLE filters were dropped, not just one.
  const allRelaxed = { ...filters, cuisines: [], max_price: 0, min_rating: 0 }
  const lastResortResults = applyFilters(data, allRelaxed)
  if (lastResortResults.length > 0) {
    return { results: lastResortResults, relaxed: true, droppedFilters: ['cuisines', 'max_price', 'min_rating'] }
  }

  return { results: [], relaxed: true, droppedFilters: ['all'] }
}