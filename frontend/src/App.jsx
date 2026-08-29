import { useState } from 'react'
import './App.css'

// Sample data for now - we'll connect this to the real dataset once the backend exists
const sampleRestaurants = [
  { name: 'Bawarchi Biryani', cuisine: 'Biryani', price: 350, rating: 3.4, locality: 'Koramangala 6th Block' },
  { name: 'Fort Kochi', cuisine: 'Kerala', price: 1800, rating: 4.1, locality: 'MG Road' },
  { name: "Domino's Pizza", cuisine: 'Pizza', price: 400, rating: 3.9, locality: 'Rajajinagar' },
  { name: 'Silbatti', cuisine: 'North Indian', price: 750, rating: 4.0, locality: 'HSR' },
  { name: 'WOW! Momo', cuisine: 'Chinese', price: 400, rating: 3.5, locality: 'Marathahalli' },
]

function App() {
  const [query, setQuery] = useState('')

  return (
    <div className="app">
      <h1>Food Search</h1>

      <input
        type="text"
        placeholder="Try: biryani under 300, rating 4+"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-bar"
      />

      <div className="results">
        {sampleRestaurants.map((r, i) => (
          <div className="card" key={i}>
            <h3>{r.name}</h3>
            <p>{r.cuisine} · {r.locality}</p>
            <p>₹{r.price} for two · ⭐ {r.rating}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App