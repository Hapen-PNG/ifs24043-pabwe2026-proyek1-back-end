import { Router } from 'express'
import { listSongs, showSong } from '../controllers/songController.js'

const router = Router()

router.get('/', listSongs)
router.get('/:id', showSong)

export default router
