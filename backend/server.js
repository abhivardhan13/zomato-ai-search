import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'
import { loadDataset } from './data.js'
import { filterRestaurants } from './filterRestaurants.js'

dotenv.config({ quiet: true })

const app = express()
app.use(cors())
app.use(express.json())

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
let restaurants = []
loadDataset().then((data) => {
  restaurants = data
  console.log(`Loaded ${restaurants.length} restaurants`)
})

// The exact shape we want back from every query, no matter how messy the input is
const filterSchema = {
  type: 'object',
  properties: {
    cuisines: {
      type: 'array',
      items: { type: 'string' },
      description: 'List of cuisines mentioned. Use multiple entries for "or" queries, e.g. ["Chinese", "Pizza"]. Empty array if none mentioned.'
    },
    max_price: { type: 'integer', description: 'Max price for two people in rupees. 0 if not mentioned.' },
    min_rating: { type: 'number', description: 'Minimum rating out of 5. 0 if not mentioned.' },
    veg_only: { type: 'boolean', description: 'True only if user explicitly asked for veg.' },
    sort_by: { type: 'string', enum: ['rating', 'price', 'none'], description: 'What to sort results by.' },
    unmapped_terms: {
      type: 'array',
      items: { type: 'string' },
      description: 'Any words from the query that do not map to cuisine/price/rating/veg (e.g. "family friendly", "spicy").'
    }
  },
  required: ['cuisines', 'max_price', 'min_rating', 'veg_only', 'sort_by', 'unmapped_terms']
}

app.post('/api/parse-query', async (req, res) => {
  try {
    const { query } = req.body

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: `Extract structured search filters from this food delivery search query: "${query}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: filterSchema
      }
    })

    const filters = JSON.parse(response.text)
    res.json(filters)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to parse query' })
  }
})

app.post('/api/search', async (req, res) => {
  try {
    const { query } = req.body

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: `Extract structured search filters from this food delivery search query: "${query}"`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: filterSchema
      }
    })

    const filters = JSON.parse(response.text)

    const hasAnyFilter =
      (filters.cuisines && filters.cuisines.length > 0) ||
      filters.max_price > 0 ||
      filters.min_rating > 0 ||
      filters.veg_only

    // Guardrail: if the query had unmapped content (e.g. negation like "not biryani")
    // but produced zero usable filters, don't silently dump the entire dataset
    if (!hasAnyFilter && filters.unmapped_terms.length > 0) {
      return res.json({
        filters,
        results: [],
        notice: "We couldn't confidently turn this into specific filters, so we're not showing unfiltered results. Try naming a cuisine, price, or rating directly."
      })
    }

    const { results, relaxed, droppedFilters } = filterRestaurants(restaurants, filters)

    let notice = null
    if (relaxed && results.length > 0) {
      const labels = droppedFilters.map(f => f === 'cuisines' ? 'cuisine' : f === 'max_price' ? 'price' : f)
      notice = `No exact matches, so we relaxed the ${labels.join(' and ')} filter${labels.length > 1 ? 's' : ''} to show the closest results.`
    } else if (relaxed && results.length === 0) {
      notice = 'No matches found even after relaxing filters.'
    }

    res.json({ filters, results, notice })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Search failed' })
  }
})

app.get('/', (req, res) => {
  res.send('Backend is running')
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})