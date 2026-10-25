import db from '../db.js'
import { HttpError } from '../utils/http.js'

const publicSongColumns = `
  s.id, s.title, s.artist, s.album, s.src, s.cover, s.duration
`

function requireSong(songId) {
  const song = db.prepare('SELECT id FROM songs WHERE id = ?').get(songId)
  if (!song) throw new HttpError(404, 'Lagu tidak ditemukan.')
}

function requireOwnedPlaylist(userId, playlistId) {
  const playlist = db.prepare(
    'SELECT id, user_id, name FROM playlists WHERE id = ? AND user_id = ?',
  ).get(playlistId, String(userId))
  if (!playlist) throw new HttpError(404, 'Playlist tidak ditemukan.')
  return playlist
}

export function listFavorites(userId) {
  return db.prepare(`
    SELECT ${publicSongColumns}
    FROM favorites f
    JOIN songs s ON s.id = f.song_id
    WHERE f.user_id = ?
    ORDER BY f.rowid DESC
  `).all(String(userId))
}

export function addFavorite(userId, songId) {
  requireSong(songId)
  db.prepare(
    'INSERT OR IGNORE INTO favorites (user_id, song_id) VALUES (?, ?)',
  ).run(String(userId), songId)
  return db.prepare(`
    SELECT ${publicSongColumns}
    FROM songs s
    WHERE s.id = ?
  `).get(songId)
}

export function removeFavorite(userId, songId) {
  requireSong(songId)
  db.prepare('DELETE FROM favorites WHERE user_id = ? AND song_id = ?')
    .run(String(userId), songId)
}

function playlistWithSongs(playlist) {
  return {
    ...playlist,
    songs: db.prepare(`
      SELECT ${publicSongColumns}, ps.position
      FROM playlist_songs ps
      JOIN songs s ON s.id = ps.song_id
      WHERE ps.playlist_id = ?
      ORDER BY ps.position, ps.song_id
    `).all(playlist.id),
  }
}

export function listPlaylists(userId) {
  return db.prepare(
    'SELECT id, name FROM playlists WHERE user_id = ? ORDER BY id DESC',
  ).all(String(userId)).map(playlistWithSongs)
}

export function createPlaylist(userId, name) {
  const result = db.prepare(
    'INSERT INTO playlists (user_id, name) VALUES (?, ?)',
  ).run(String(userId), name)
  return playlistWithSongs({
    id: Number(result.lastInsertRowid),
    name,
  })
}

export function renamePlaylist(userId, playlistId, name) {
  requireOwnedPlaylist(userId, playlistId)
  db.prepare('UPDATE playlists SET name = ? WHERE id = ? AND user_id = ?')
    .run(name, playlistId, String(userId))
  return playlistWithSongs({ id: playlistId, name })
}

export function deletePlaylist(userId, playlistId) {
  requireOwnedPlaylist(userId, playlistId)
  db.prepare('DELETE FROM playlists WHERE id = ? AND user_id = ?')
    .run(playlistId, String(userId))
}

export function addPlaylistSong(userId, playlistId, songId) {
  requireOwnedPlaylist(userId, playlistId)
  requireSong(songId)
  const nextPosition = db.prepare(`
    SELECT COALESCE(MAX(position), -1) + 1 AS position
    FROM playlist_songs
    WHERE playlist_id = ?
  `).get(playlistId).position
  db.prepare(`
    INSERT OR IGNORE INTO playlist_songs (playlist_id, song_id, position)
    VALUES (?, ?, ?)
  `).run(playlistId, songId, nextPosition)
  const playlist = db.prepare(
    'SELECT id, name FROM playlists WHERE id = ? AND user_id = ?',
  ).get(playlistId, String(userId))
  return playlistWithSongs(playlist)
}

export function removePlaylistSong(userId, playlistId, songId) {
  requireOwnedPlaylist(userId, playlistId)
  requireSong(songId)
  const result = db.prepare(`
    DELETE FROM playlist_songs
    WHERE playlist_id = ? AND song_id = ?
  `).run(playlistId, songId)
  if (result.changes === 0) {
    throw new HttpError(404, 'Lagu tidak ditemukan dalam playlist.')
  }
}

export function listRecentPlays(userId) {
  return db.prepare(`
    SELECT ${publicSongColumns}, rp.played_at
    FROM recent_plays rp
    JOIN songs s ON s.id = rp.song_id
    WHERE rp.user_id = ?
    ORDER BY rp.played_at DESC, rp.id DESC
    LIMIT 5
  `).all(String(userId))
}

export function recordRecentPlay(userId, songId) {
  requireSong(songId)
  const insert = db.prepare(`
    INSERT INTO recent_plays (user_id, song_id, played_at)
    VALUES (?, ?, ?)
  `)
  const prune = db.prepare(`
    DELETE FROM recent_plays
    WHERE user_id = ?
      AND id NOT IN (
        SELECT id FROM recent_plays
        WHERE user_id = ?
        ORDER BY played_at DESC, id DESC
        LIMIT 5
      )
  `)
  db.transaction(() => {
    insert.run(String(userId), songId, new Date().toISOString())
    prune.run(String(userId), String(userId))
  })()
  return listRecentPlays(userId)
}

export function recordPlay(userId, songId) {
  requireSong(songId)
  db.prepare(`
    INSERT INTO play_counts (user_id, song_id, count)
    VALUES (?, ?, 1)
    ON CONFLICT (user_id, song_id)
    DO UPDATE SET count = count + 1
  `).run(String(userId), songId)
  return db.prepare(`
    SELECT count FROM play_counts WHERE user_id = ? AND song_id = ?
  `).get(String(userId), songId).count
}

export function getPlayStats(userId) {
  const total = db.prepare(`
    SELECT COALESCE(SUM(count), 0) AS total
    FROM play_counts
    WHERE user_id = ?
  `).get(String(userId)).total
  const topPlayed = db.prepare(`
    SELECT ${publicSongColumns}, pc.count
    FROM play_counts pc
    JOIN songs s ON s.id = pc.song_id
    WHERE pc.user_id = ?
    ORDER BY pc.count DESC, s.title COLLATE NOCASE
    LIMIT 3
  `).all(String(userId))
  return { totalPlays: total, topPlayed }
}

export function listSearchHistory(userId) {
  return db.prepare(`
    SELECT id, term, created_at
    FROM search_history
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 8
  `).all(String(userId))
}

export function addSearchTerm(userId, term) {
  const key = String(userId)
  const insert = db.prepare(`
    INSERT INTO search_history (user_id, term, created_at)
    VALUES (?, ?, ?)
  `)
  const removeDuplicateTerms = db.prepare(`
    DELETE FROM search_history
    WHERE user_id = ? AND term = ? COLLATE NOCASE
  `)
  const prune = db.prepare(`
    DELETE FROM search_history
    WHERE user_id = ?
      AND id NOT IN (
        SELECT id FROM search_history
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 8
      )
  `)
  db.transaction(() => {
    removeDuplicateTerms.run(key, term)
    insert.run(key, term, new Date().toISOString())
    prune.run(key, key)
  })()
  return listSearchHistory(key)
}

export function removeSearchTerm(userId, historyId) {
  const result = db.prepare(
    'DELETE FROM search_history WHERE id = ? AND user_id = ?',
  ).run(historyId, String(userId))
  if (result.changes === 0) throw new HttpError(404, 'Riwayat pencarian tidak ditemukan.')
}

export function clearSearchHistory(userId) {
  db.prepare('DELETE FROM search_history WHERE user_id = ?')
    .run(String(userId))
}
