import cors from 'cors'
import express from 'express'
import authenticate from './middleware/auth.js'
import apiRoutes from './routes/api.js'
import healthRoute from './routes/health.js'
import songsRoute from './routes/songs.js'

const app = express()
const frontendOrigin = process.env.FRONTEND_ORIGIN

if (frontendOrigin === '*') {
  throw new Error('FRONTEND_ORIGIN harus berupa satu origin eksplisit, bukan "*".')
}

app.use(express.json())
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || origin === frontendOrigin)
  },
}))

app.use('/api/health', healthRoute)
app.use('/api/songs', songsRoute)
app.use('/api', authenticate, apiRoutes)

app.use((req, _res, next) => {
  const error = new Error(`Route tidak ditemukan: ${req.method} ${req.originalUrl}`)
  error.statusCode = 404
  next(error)
})

app.use((error, _req, res, _next) => {
  const candidateStatus = error.statusCode ?? error.status
  const statusCode = Number.isInteger(candidateStatus) &&
    candidateStatus >= 400 &&
    candidateStatus <= 599
    ? candidateStatus
    : 500
  if (statusCode >= 500) console.error(error)
  return res.status(statusCode).json({
    status: 'fail',
    message: statusCode >= 500 ? 'Terjadi kesalahan pada server' : error.message,
    data: {},
  })
})

export default app
