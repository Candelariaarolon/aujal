import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { db, transaction } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIMENSION_NAMES = {
  'D1-Contexto': 'Contexto de la Institución',
  'D1-Infraestructura y Entorno': 'Infraestructura y Entorno',
  'D2-Energía y Cámbio Climático': 'Energía y Cambio Climático',
  'D3-Residuos': 'Gestión de Residuos',
  'D4-Agua': 'Agua',
  'D5-Transporte': 'Transporte y Movilidad',
  'D6-Educación e Investigación': 'Educación e Investigación',
  'D7-Gobernanza y Digitalización': 'Gobernanza y Digitalización',
  'D8-Espiritualidad Ignaciana': 'Espiritualidad Ignaciana',
};

const DEFAULT_PASSWORD = 'Ausjal2026!';

function slugify(str) {
  return str
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/(^\.|\.$)/g, '')
    .slice(0, 40);
}

export function seedIfEmpty() {
  const dimCount = db.prepare('SELECT COUNT(*) c FROM dimensiones').get().c;
  if (dimCount === 0) seedDimensionesEIndicadores();

  const uniCount = db.prepare('SELECT COUNT(*) c FROM universidades').get().c;
  if (uniCount === 0) seedUniversidadesYResponsables();
}

function seedDimensionesEIndicadores() {
  const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'indicadores_raw.json'), 'utf-8'));

  const insertDim = db.prepare('INSERT INTO dimensiones (codigo, nombre, orden) VALUES (?, ?, ?)');
  const insertInd = db.prepare(`
    INSERT INTO indicadores (dimension_id, codigo, nombre, descripcion, formula, unidad, fuentes, es_ausjal, orden)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  transaction(() => {
    raw.forEach((dim, i) => {
      const nombre = DIMENSION_NAMES[dim.sheet] || dim.sheet;
      const info = insertDim.run(dim.sheet, nombre, i + 1);
      const dimId = info.lastInsertRowid;
      dim.indicadores.forEach((ind, j) => {
        insertInd.run(
          dimId,
          ind.codigo,
          ind.nombre || ind.codigo,
          ind.descripcion || null,
          ind.formula || null,
          ind.unidad || null,
          ind.fuentes || null,
          ind.es_ausjal ? 1 : 0,
          j + 1
        );
      });
    });
  });
  console.log('Dimensiones e indicadores cargados.');
}

function seedUniversidadesYResponsables() {
  const universidades = JSON.parse(fs.readFileSync(path.join(__dirname, 'universidades.json'), 'utf-8'));

  const insertUni = db.prepare('INSERT INTO universidades (nombre, pais, escudo_emoji) VALUES (?, ?, ?)');
  const insertUser = db.prepare(`
    INSERT INTO usuarios (nombre, apellido, email, password_hash, universidad_id, rol, estado)
    VALUES (?, ?, ?, ?, ?, 'responsable', 'aprobada')
  `);

  const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  const credenciales = ['email,password,universidad'];
  const slugsUsados = new Set();

  transaction(() => {
    universidades.forEach((u) => {
      const info = insertUni.run(u.nombre, u.pais, '🎓');
      const uniId = info.lastInsertRowid;
      let slug = slugify(u.nombre);
      if (slugsUsados.has(slug)) slug = `${slug}.${uniId}`;
      slugsUsados.add(slug);
      const email = `responsable.${slug}@ausjal.org`;
      insertUser.run('Responsable', 'Institucional', email, passwordHash, uniId);
      credenciales.push(`${email},${DEFAULT_PASSWORD},"${u.nombre}"`);
    });
  });

  const outPath = path.join(__dirname, '..', 'data', 'credenciales_iniciales.csv');
  fs.writeFileSync(outPath, credenciales.join('\n'), 'utf-8');
  console.log(`Universidades y responsables iniciales cargados. Credenciales en ${outPath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedIfEmpty();
  console.log('Seed finalizado.');
}
