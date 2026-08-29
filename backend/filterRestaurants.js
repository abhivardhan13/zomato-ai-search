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
    return { results: strictResults, relaxed: false, droppedFilter: null }
  }

  // Guardrail: zero exact matches - relax the strictest filter first, one at a time,
  // instead of showing a blank screen (this is Step 5 of the architecture plan)
  const relaxOrder = ['min_rating', 'max_price', 'cuisines']
  let currentFilters = { ...filters }

  for (const key of relaxOrder) {
    currentFilters = key === 'cuisines'
      ? { ...currentFilters, cuisines: [] }
      : { ...currentFilters, [key]: 0 }

    const relaxedResults = applyFilters(data, currentFilters)
    if (relaxedResults.length > 0) {
      return { results: relaxedResults, relaxed: true, droppedFilter: key }
    }
  }

  return { results: [], relaxed: true, droppedFilter: 'all' }
}