import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
    const [filters, setFilters] = useState(null)
      const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
      const data = await res.json()
      setResults(data.results)
      setFilters(data.filters)
      setNotice(data.notice || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="app">
      <h1>Food Search</h1>

      <input
        type="text"
        placeholder="Try: biryani under 300, rating 4+"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        className="search-bar"
      />

      {loading && <p>Searching...</p>}
            {filters && !loading && (
        <div className="filter-breakdown">
          <strong>Understood as:</strong>{' '}
          {filters.cuisines && filters.cuisines.length > 0 && <span>Cuisine: {filters.cuisines.join(' or ')} </span>}
          {filters.max_price > 0 && <span>| Max Price: ₹{filters.max_price} </span>}
          {filters.min_rating > 0 && <span>| Min Rating: {filters.min_rating} </span>}
          {filters.veg_only && <span>| Veg only </span>}
          {filters.sort_by !== 'none' && <span>| Sorted by: {filters.sort_by} </span>}
          {filters.unmapped_terms.length > 0 && (
            <div className="unmapped">
              Couldn't interpret: {filters.unmapped_terms.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="results">
              {notice && <div className="notice">{notice}</div>}
        {results.map((r, i) => (
          <div className="card" key={i}>
            <h3>{r.name}</h3>
            <p>{r.cuisine} · {r.locality}</p>
            <p>₹{r.price_for_two} for two · ⭐ {r.rating}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App