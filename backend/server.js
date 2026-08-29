import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { GoogleGenAI } from '@google/genai'

dotenv.config({ quiet: true })

const app = express()
app.use(cors())
app.use(express.json())

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// The exact shape we want back from every query, no matter how messy the input is
const filterSchema = {
  type: 'object',
  properties: {
    cuisine: { type: 'string', description: 'e.g. Biryani, Pizza, Chinese. Empty string if not mentioned.' },
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
  required: ['cuisine', 'max_price', 'min_rating', 'veg_only', 'sort_by', 'unmapped_terms']
}

app.post('/api/parse-query', async (req, res) => {
  try {
    const { query } = req.body

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
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

app.get('/', (req, res) => {
  res.send('Backend is running')
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})