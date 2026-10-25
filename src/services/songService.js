import db from '../db.js'
import { HttpError } from '../utils/http.js'

const songSelect = `
  SELECT id, title, artist, album, src, cover, duration
  FROM songs
`
const lyricSelect = db.prepare(
  'SELECT time, text FROM lyrics WHERE song_id = ? ORDER BY time',
)

function attachLyrics(song) {
  return { ...song, lyrics: lyricSelect.all(song.id) }
}

export function getSongs() {
  return db.prepare(`${songSelect} ORDER BY id`).all().map(attachLyrics)
}

export function getSongById(songId) {
  const song = db.prepare(`${songSelect} WHERE id = ?`).get(songId)
  if (!song) throw new HttpError(404, 'Lagu tidak ditemukan.')
  return attachLyrics(song)
}
