import {
  addFavorite,
  addPlaylistSong,
  addSearchTerm,
  clearSearchHistory,
  createPlaylist,
  deletePlaylist,
  getPlayStats,
  listFavorites,
  listPlaylists,
  listRecentPlays,
  listSearchHistory,
  recordPlay,
  recordRecentPlay,
  removeFavorite,
  removePlaylistSong,
  removeSearchTerm,
  renamePlaylist,
} from '../services/libraryService.js'
import { parsePositiveId, parseText, sendSuccess } from '../utils/http.js'

export function getFavorites(req, res) {
  return sendSuccess(res, 'Favorit berhasil diambil.', {
    favorites: listFavorites(req.user.id),
  })
}

export function putFavorite(req, res) {
  const songId = parsePositiveId(req.params.songId, 'songId')
  return sendSuccess(res, 'Lagu ditambahkan ke favorit.', {
    favorite: addFavorite(req.user.id, songId),
  })
}

export function deleteFavorite(req, res) {
  const songId = parsePositiveId(req.params.songId, 'songId')
  removeFavorite(req.user.id, songId)
  return sendSuccess(res, 'Lagu dihapus dari favorit.')
}

export function getPlaylists(req, res) {
  return sendSuccess(res, 'Playlist berhasil diambil.', {
    playlists: listPlaylists(req.user.id),
  })
}

export function postPlaylist(req, res) {
  const name = parseText(req.body?.name, 'name', 100)
  return res.status(201).json({
    status: 'success',
    message: 'Playlist berhasil dibuat.',
    data: { playlist: createPlaylist(req.user.id, name) },
  })
}

export function patchPlaylist(req, res) {
  const playlistId = parsePositiveId(req.params.id, 'id')
  const name = parseText(req.body?.name, 'name', 100)
  return sendSuccess(res, 'Playlist berhasil diperbarui.', {
    playlist: renamePlaylist(req.user.id, playlistId, name),
  })
}

export function deletePlaylistById(req, res) {
  const playlistId = parsePositiveId(req.params.id, 'id')
  deletePlaylist(req.user.id, playlistId)
  return sendSuccess(res, 'Playlist berhasil dihapus.')
}

export function postPlaylistSong(req, res) {
  const playlistId = parsePositiveId(req.params.id, 'id')
  const songId = parsePositiveId(req.body?.songId, 'songId')
  return sendSuccess(res, 'Lagu berhasil ditambahkan ke playlist.', {
    playlist: addPlaylistSong(req.user.id, playlistId, songId),
  })
}

export function deletePlaylistSong(req, res) {
  const playlistId = parsePositiveId(req.params.id, 'id')
  const songId = parsePositiveId(req.params.songId, 'songId')
  removePlaylistSong(req.user.id, playlistId, songId)
  return sendSuccess(res, 'Lagu berhasil dihapus dari playlist.')
}

export function getRecentPlays(req, res) {
  return sendSuccess(res, 'Riwayat putar berhasil diambil.', {
    recent: listRecentPlays(req.user.id),
  })
}

export function postRecentPlay(req, res) {
  const songId = parsePositiveId(req.body?.songId, 'songId')
  return sendSuccess(res, 'Riwayat putar berhasil disimpan.', {
    recent: recordRecentPlay(req.user.id, songId),
  })
}

export function postPlayStat(req, res) {
  const songId = parsePositiveId(req.body?.songId, 'songId')
  return sendSuccess(res, 'Statistik pemutaran berhasil diperbarui.', {
    playCount: recordPlay(req.user.id, songId),
  })
}

export function getPlayStatsForUser(req, res) {
  return sendSuccess(res, 'Statistik pemutaran berhasil diambil.', {
    stats: getPlayStats(req.user.id),
  })
}

export function getSearchHistory(req, res) {
  return sendSuccess(res, 'Riwayat pencarian berhasil diambil.', {
    history: listSearchHistory(req.user.id),
  })
}

export function postSearchTerm(req, res) {
  const term = parseText(req.body?.term, 'term', 200)
  return sendSuccess(res, 'Riwayat pencarian berhasil disimpan.', {
    history: addSearchTerm(req.user.id, term),
  })
}

export function deleteSearchTerm(req, res) {
  const historyId = parsePositiveId(req.params.id, 'id')
  removeSearchTerm(req.user.id, historyId)
  return sendSuccess(res, 'Riwayat pencarian berhasil dihapus.')
}

export function deleteAllSearchHistory(req, res) {
  clearSearchHistory(req.user.id)
  return sendSuccess(res, 'Seluruh riwayat pencarian berhasil dihapus.')
}
