import songs from '../../frontend/src/data/songs.js'
import db from './db.js'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const insertSong = db.prepare(`
  INSERT INTO songs (id, title, artist, album, src, cover, duration)
  VALUES (@id, @title, @artist, @album, @src, @cover, @duration)
`)
const insertLyric = db.prepare(
  'INSERT INTO lyrics (song_id, time, text) VALUES (?, ?, ?)',
)
const updateSongCover = db.prepare(
  'UPDATE songs SET cover = @cover WHERE id = @id',
)

export function seedDatabase() {
  const songCount = db.prepare('SELECT COUNT(*) AS count FROM songs').get().count
  if (songCount > 0) {
    const updateCovers = db.transaction(() => {
      for (const song of songs) {
        updateSongCover.run({ id: song.id, cover: song.cover })
      }
    })
    updateCovers()
    return false
  }

  const seed = db.transaction(() => {
    for (const song of songs) {
      insertSong.run({
        id: song.id,
        title: song.title,
        artist: song.artist,
        album: song.album ?? '',
        src: song.src,
        cover: song.cover,
        duration: Number.isFinite(song.duration) && song.duration >= 0
          ? song.duration
          : null,
      })
      for (const lyric of song.lyrics ?? []) {
        insertLyric.run(song.id, lyric.time, lyric.text)
      }
    }
  })
  seed()
  return true
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  seedDatabase()
}
