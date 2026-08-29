import { useState } from 'react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
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

      <div className="results">
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