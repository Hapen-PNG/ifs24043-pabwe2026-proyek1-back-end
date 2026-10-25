import { Router } from 'express'
import {
  deleteAllSearchHistory,
  deleteFavorite,
  deletePlaylistById,
  deletePlaylistSong,
  deleteSearchTerm,
  getFavorites,
  getPlaylists,
  getPlayStatsForUser,
  getRecentPlays,
  getSearchHistory,
  patchPlaylist,
  postPlayStat,
  postPlaylist,
  postPlaylistSong,
  postRecentPlay,
  postSearchTerm,
  putFavorite,
} from '../controllers/libraryController.js'
import { getCurrentUser } from '../controllers/userController.js'
import rejectUserId from '../middleware/rejectUserId.js'

const router = Router()

router.use(rejectUserId)

router.get('/me', getCurrentUser)
router.route('/favorites')
  .get(getFavorites)
router.put('/favorites/:songId', putFavorite)
router.delete('/favorites/:songId', deleteFavorite)

router.route('/playlists')
  .get(getPlaylists)
  .post(postPlaylist)
router.route('/playlists/:id')
  .patch(patchPlaylist)
  .delete(deletePlaylistById)
router.post('/playlists/:id/songs', postPlaylistSong)
router.delete('/playlists/:id/songs/:songId', deletePlaylistSong)

router.route('/recent')
  .get(getRecentPlays)
  .post(postRecentPlay)
router.post('/stats/play', postPlayStat)
router.get('/stats', getPlayStatsForUser)

router.route('/search-history')
  .get(getSearchHistory)
  .post(postSearchTerm)
  .delete(deleteAllSearchHistory)
router.delete('/search-history/:id', deleteSearchTerm)

export default router
