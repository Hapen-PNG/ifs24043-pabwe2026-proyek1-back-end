import { getSongById, getSongs } from '../services/songService.js'
import { parsePositiveId, sendSuccess } from '../utils/http.js'

export function listSongs(_req, res) {
  return sendSuccess(res, 'Daftar lagu berhasil diambil.', {
    songs: getSongs(),
  })
}

export function showSong(req, res) {
  const songId = parsePositiveId(req.params.id, 'id lagu')
  return sendSuccess(res, 'Lagu berhasil diambil.', {
    song: getSongById(songId),
  })
}
