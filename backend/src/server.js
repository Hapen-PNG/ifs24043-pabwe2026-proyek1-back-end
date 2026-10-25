import 'dotenv/config'
import app from './app.js'
import './db.js'
import { seedDatabase } from './seed.js'

const port = Number.parseInt(process.env.PORT || '4000', 10)

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT harus berupa angka antara 1 dan 65535.')
}

seedDatabase()

app.listen(port, () => {
  console.log(`Backend berjalan di http://localhost:${port}`)
})
