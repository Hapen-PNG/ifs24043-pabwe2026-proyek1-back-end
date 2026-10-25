import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dataDirectory = fileURLToPath(new URL('../data/', import.meta.url))
mkdirSync(dataDirectory, { recursive: true })

const databasePath = fileURLToPath(new URL('../data/app.db', import.meta.url))
const db = new Database(databasePath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

const migrations = [
  {
    version: 1,
    up() {
      db.exec(`
        CREATE TABLE songs (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          artist TEXT NOT NULL,
          album TEXT NOT NULL,
          src TEXT NOT NULL,
          cover TEXT NOT NULL,
          lyrics TEXT NOT NULL
        )
      `)
    },
  },
  {
    version: 2,
    up() {
      db.exec(`
        ALTER TABLE songs RENAME TO songs_legacy;

        CREATE TABLE songs (
          id INTEGER PRIMARY KEY,
          title TEXT NOT NULL,
          artist TEXT NOT NULL,
          album TEXT NOT NULL,
          src TEXT NOT NULL,
          cover TEXT NOT NULL,
          duration REAL CHECK (duration IS NULL OR duration >= 0)
        );

        CREATE TABLE lyrics (
          song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
          time REAL NOT NULL CHECK (time >= 0),
          text TEXT NOT NULL,
          PRIMARY KEY (song_id, time)
        );

        CREATE TABLE favorites (
          user_id TEXT NOT NULL,
          song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
          PRIMARY KEY (user_id, song_id)
        );

        CREATE TABLE playlists (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100)
        );

        CREATE TABLE playlist_songs (
          playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
          song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
          position INTEGER NOT NULL CHECK (position >= 0),
          PRIMARY KEY (playlist_id, song_id),
          UNIQUE (playlist_id, position)
        );

        CREATE TABLE recent_plays (
          user_id TEXT NOT NULL,
          song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
          played_at TEXT NOT NULL,
          id INTEGER PRIMARY KEY AUTOINCREMENT
        );
        CREATE INDEX recent_plays_user_date
          ON recent_plays (user_id, played_at DESC, id DESC);

        CREATE TABLE play_counts (
          user_id TEXT NOT NULL,
          song_id INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
          count INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
          PRIMARY KEY (user_id, song_id)
        );

        CREATE TABLE search_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          term TEXT NOT NULL CHECK (length(trim(term)) BETWEEN 1 AND 200),
          created_at TEXT NOT NULL
        );
        CREATE INDEX search_history_user_date
          ON search_history (user_id, created_at DESC, id DESC);

        INSERT INTO songs (id, title, artist, album, src, cover, duration)
        SELECT id, title, artist, album, src, cover, NULL
        FROM songs_legacy;
      `)

      const legacySongs = db.prepare('SELECT id, lyrics FROM songs_legacy').all()
      const insertLyric = db.prepare(
        'INSERT INTO lyrics (song_id, time, text) VALUES (?, ?, ?)',
      )
      for (const song of legacySongs) {
        let lyricRows
        try {
          lyricRows = JSON.parse(song.lyrics)
        } catch (error) {
          console.error(`Lirik lama lagu ${song.id} tidak valid; dilewati.`, error)
          continue
        }
        if (!Array.isArray(lyricRows)) continue
        for (const lyric of lyricRows) {
          if (
            Number.isFinite(lyric?.time) &&
            lyric.time >= 0 &&
            typeof lyric.text === 'string'
          ) {
            insertLyric.run(song.id, lyric.time, lyric.text)
          }
        }
      }
      db.exec('DROP TABLE songs_legacy')
    },
  },
]

db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)

const hasMigration = db.prepare(
  'SELECT 1 FROM schema_migrations WHERE version = ?',
)
const markMigration = db.prepare(
  'INSERT INTO schema_migrations (version) VALUES (?)',
)

for (const migration of migrations) {
  if (hasMigration.get(migration.version)) continue
  db.transaction(() => {
    migration.up()
    markMigration.run(migration.version)
  })()
}

export default db
