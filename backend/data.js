import fs from 'fs'
import csvParser from 'csv-parser'

export function loadDataset() {
  return new Promise((resolve, reject) => {
    const results = []
    fs.createReadStream('./data/zomato_final_dataset.csv')
      .pipe(csvParser())
      .on('data', (row) => {
        // CSV gives everything as strings - convert numeric fields properly
        results.push({
          name: row.name,
          locality: row.locality,
          cuisine: row.cuisine,
          all_cuisines: row.all_cuisines,
          price_for_two: parseInt(row.price_for_two, 10),
          rating: parseFloat(row.rating),
          votes: parseInt(row.votes, 10),
          restaurant_type: row.restaurant_type,
          veg_only: row.veg_only === 'True',
          distance_km: parseFloat(row.distance_km)
        })
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err))
  })
}