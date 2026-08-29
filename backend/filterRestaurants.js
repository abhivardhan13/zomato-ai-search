export function filterRestaurants(data, filters) {
  let results = data.filter((r) => {
    // Cuisine: match if filter is empty, or if it appears in cuisine/all_cuisines (case-insensitive)
    const cuisineMatch =
      !filters.cuisine ||
      r.cuisine.toLowerCase().includes(filters.cuisine.toLowerCase()) ||
      r.all_cuisines.toLowerCase().includes(filters.cuisine.toLowerCase())

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