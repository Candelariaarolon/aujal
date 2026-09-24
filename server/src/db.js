import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(path.join(dataDir, 'ausjal.db'));
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

db.exec(`
CREATE TABLE IF NOT EXISTS universidades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  pais TEXT NOT NULL,
  escudo_emoji TEXT NOT NULL DEFAULT '🎓'
);

CREATE TABLE IF NOT EXISTS dimensiones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS indicadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dimension_id INTEGER NOT NULL REFERENCES dimensiones(id),
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  formula TEXT,
  unidad TEXT,
  fuentes TEXT,
  es_ausjal INTEGER NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  universidad_id INTEGER NOT NULL REFERENCES universidades(id),
  rol TEXT NOT NULL CHECK(rol IN ('responsable','institucional')),
  estado TEXT NOT NULL CHECK(estado IN ('pendiente','aprobada','rechazada')) DEFAULT 'pendiente',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS valores_indicador (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  universidad_id INTEGER NOT NULL REFERENCES universidades(id),
  indicador_id INTEGER NOT NULL REFERENCES indicadores(id),
  dato_registrado TEXT,
  estado TEXT NOT NULL CHECK(estado IN ('verde','amarillo','naranja','rojo','sin_informacion')) DEFAULT 'sin_informacion',
  actualizado_por INTEGER REFERENCES usuarios(id),
  actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(universidad_id, indicador_id)
);

CREATE INDEX IF NOT EXISTS idx_usuarios_universidad ON usuarios(universidad_id);
CREATE INDEX IF NOT EXISTS idx_valores_universidad ON valores_indicador(universidad_id);
CREATE INDEX IF NOT EXISTS idx_valores_indicador ON valores_indicador(indicador_id);
CREATE INDEX IF NOT EXISTS idx_indicadores_dimension ON indicadores(dimension_id);
`);
