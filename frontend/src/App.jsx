import { useState, useEffect } from 'react'
import './App.css'

const cuisineIcons = {
  biryani: 'rice_bowl', desserts: 'cake', 'ice cream': 'icecream',
  chinese: 'ramen_dining', pizza: 'local_pizza', 'south indian': 'eco',
  'north indian': 'dinner_dining', kerala: 'restaurant', andhra: 'local_fire_department',
  cafe: 'coffee', beverages: 'local_cafe', bakery: 'bakery_dining',
  'fast food': 'lunch_dining', 'street food': 'ramen_dining'
}
function getIcon(cuisine) {
  return cuisineIcons[cuisine?.toLowerCase()] || 'restaurant'
}
function ratingColor(rating) {
  return rating >= 4.0 ? '#2e7d32' : '#f57c00'
}

const categoryStyles = [
  { bg: '#ffdad6', fg: '#93000d' },
  { bg: '#d7e4ec', fg: '#3c494f' },
  { bg: '#ffddb4', fg: '#805200' },
]

function RestaurantCard({ r }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-surface-variant flex flex-col overflow-hidden hover:shadow-[0_6px_24px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-200">
      <div className="w-full h-32 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f5f3ef, #eae8e4)' }}>
        <span className="material-symbols-outlined text-primary" style={{ fontSize: '44px' }}>
          {getIcon(r.cuisine)}
        </span>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg text-on-surface">{r.name}</h3>
            <p className="text-sm text-on-surface-variant mt-1">{r.cuisine} · {r.locality}</p>
          </div>
          <div className="flex items-center gap-1 text-white px-2 py-1 rounded-md shrink-0" style={{ background: ratingColor(r.rating) }}>
            <span className="font-bold text-sm">{r.rating}</span>
            <span className="material-symbols-outlined text-[14px]">star</span>
          </div>
        </div>
        <div className="mt-2 pt-3 border-t border-surface-variant flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">payments</span>
          <span className="text-sm text-on-surface-variant">₹{r.price_for_two} for two</span>
        </div>
      </div>
    </div>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [filters, setFilters] = useState(null)
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [nearby, setNearby] = useState([])
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    fetch('http://localhost:3001/api/nearby')
      .then(res => res.json())
      .then(data => setNearby(data.results || []))
      .catch(err => console.error(err))
  }, [])

  const handleSearch = async (customQuery) => {
    const q = customQuery ?? query
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setHasSearched(true)
    try {
      const res = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setResults(data.results || [])
      setFilters(data.filters || null)
      setNotice(data.notice || null)
    } catch (err) {
      console.error(err)
      setError("Something went wrong on our end. Please try again in a moment.")
      setResults([])
      setFilters(null)
      setNotice(null)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleCategoryClick = (label) => {
    setQuery(label)
    handleSearch(label)
  }

  const handleBack = () => {
    setHasSearched(false)
    setQuery('')
    setResults([])
    setFilters(null)
    setNotice(null)
    setError(null)
  }

  const categories = [
    { label: 'Biryani', icon: 'rice_bowl' },
    { label: 'Sweets', icon: 'cake' },
    { label: 'Veg', icon: 'eco' },
    { label: 'Chinese', icon: 'ramen_dining' },
    { label: 'Pizza', icon: 'local_pizza' },
    { label: 'Desserts', icon: 'icecream' },
  ]

  return (
    <div className="bg-background text-on-surface min-h-screen pb-24">
      <header className="fixed top-0 w-full z-50 bg-background shadow-sm">
        <div className="flex justify-between items-center px-5 h-16 max-w-[720px] mx-auto">
          <div className="flex items-center gap-2">
            {hasSearched && (
              <button onClick={handleBack} className="text-on-surface active:scale-90 transition-transform">
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
            <h1 className="text-xl font-bold text-primary" style={{ letterSpacing: '-0.03em' }}>QuickBite AI</h1>
          </div>
          <button className="text-primary relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-primary-container rounded-full border border-background"></span>
          </button>
        </div>
      </header>

      <main className="pt-24 px-5 max-w-[720px] mx-auto">
        {!hasSearched && (
          <p className="text-sm text-on-surface-variant mb-4 -mt-2">
            Ask naturally — we'll show you exactly what we understood.
          </p>
        )}

        <section className="mb-8">
          <div className="relative w-full flex items-center bg-surface-container-lowest rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-surface-variant p-2 pl-4 focus-within:shadow-[0_4px_20px_rgba(15,118,110,0.15)] focus-within:border-teal-300 transition-all">
            <input
              className="flex-grow bg-transparent border-none focus:ring-0 text-on-surface placeholder-on-surface-variant outline-none p-0"
              placeholder="What are you craving? Try: biryani under 300, rating 4+"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={() => handleSearch()}
              className="flex items-center gap-1 bg-teal-50 text-teal-700 px-3 py-2 rounded-full active:scale-95 hover:bg-teal-100 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span className="text-sm font-bold whitespace-nowrap">AI Mode</span>
            </button>
          </div>
        </section>

        {!hasSearched && (
          <section className="mb-8 -mx-5 px-5">
            <div className="flex overflow-x-auto gap-3 pb-2">
              {categories.map((c, i) => {
                const style = categoryStyles[i % categoryStyles.length]
                return (
                  <button
                    key={c.label}
                    onClick={() => handleCategoryClick(c.label)}
                    className="flex flex-col items-center justify-center min-w-[80px] h-[100px] bg-surface-container-lowest rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-surface-variant hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all active:scale-95"
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-2" style={{ background: style.bg, color: style.fg }}>
                      <span className="material-symbols-outlined">{c.icon}</span>
                    </div>
                    <span className="text-xs font-medium">{c.label}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-on-surface-variant py-4">
            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
            <span>Finding the best matches...</span>
          </div>
        )}
        {error && <div className="error">{error}</div>}

        {filters && !loading && (
          <div className="filter-breakdown">
            <strong>Understood as:</strong>{' '}
            {filters.cuisines?.length > 0 && <span>Cuisine: {filters.cuisines.join(' or ')} </span>}
            {filters.max_price > 0 && <span>| Max Price: ₹{filters.max_price} </span>}
            {filters.min_rating > 0 && <span>| Min Rating: {filters.min_rating} </span>}
            {filters.veg_only && <span>| Veg only </span>}
            {filters.sort_by !== 'none' && <span>| Sorted by: {filters.sort_by} </span>}
            {filters.unmapped_terms?.length > 0 && (
              <div className="unmapped">Couldn't interpret: {filters.unmapped_terms.join(', ')}</div>
            )}
          </div>
        )}

        {notice && <div className="notice">{notice}</div>}

        <section className="pb-8">
          <h2 className="text-xl font-semibold mb-4">
            {hasSearched ? `Results for "${query}"` : 'Restaurants near you'}
          </h2>
          <div className="flex flex-col gap-4">
            {(hasSearched ? results : nearby).map((r, i) => (
              <RestaurantCard key={i} r={r} />
            ))}
          </div>
          {hasSearched && !loading && results.length === 0 && !notice && !error && (
            <p className="text-on-surface-variant text-sm">No results to show.</p>
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 w-full bg-surface shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-surface-variant">
        <div className="flex justify-around items-center py-3 max-w-[720px] mx-auto">
          <button onClick={handleBack} className="flex flex-col items-center text-primary font-bold w-16 active:scale-90 transition-transform">
            <span className="material-symbols-outlined mb-1">home</span>
            <span className="text-xs">Home</span>
          </button>
          <button className="flex flex-col items-center text-secondary w-16 active:scale-90 transition-transform">
            <span className="material-symbols-outlined mb-1">receipt_long</span>
            <span className="text-xs">Orders</span>
          </button>
          <button className="flex flex-col items-center text-secondary w-16 active:scale-90 transition-transform">
            <span className="material-symbols-outlined mb-1">person</span>
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default App