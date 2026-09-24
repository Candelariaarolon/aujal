import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();

const ESTADOS_VALIDOS = ['verde', 'amarillo', 'naranja', 'rojo', 'sin_informacion'];

// Pantalla 7 — Comparar indicadores: agrupa universidades por estado para un indicador puntual.
router.get('/:id/comparacion', requireAuth, (req, res) => {
  const indicador = db.prepare(`
    SELECT i.*, d.nombre AS dimension_nombre
    FROM indicadores i JOIN dimensiones d ON d.id = i.dimension_id
    WHERE i.id = ?
  `).get(req.params.id);
  if (!indicador) return res.status(404).json({ error: 'Indicador no encontrado.' });

  const universidades = db.prepare('SELECT id, nombre, pais, escudo_emoji FROM universidades ORDER BY nombre ASC').all();
  const valores = db.prepare('SELECT universidad_id, estado FROM valores_indicador WHERE indicador_id = ?').all(indicador.id);
  const estadoPorUniversidad = new Map(valores.map(v => [v.universidad_id, v.estado]));

  const grupos = { verde: [], amarillo: [], naranja: [], rojo: [], sin_informacion: [] };
  universidades.forEach(u => {
    const estado = estadoPorUniversidad.get(u.id) || 'sin_informacion';
    grupos[estado].push(u);
  });

  res.json({
    indicador: {
      id: indicador.id,
      codigo: indicador.codigo,
      nombre: indicador.nombre,
      descripcion: indicador.descripcion,
      unidad: indicador.unidad,
      dimension_nombre: indicador.dimension_nombre,
    },
    grupos,
  });
});

// Pantalla 6 — Gestionar indicadores: guardar dato + estado de un indicador para la propia universidad.
router.put('/:id/valor', requireAuth, requireRole('responsable'), (req, res) => {
  const indicador = db.prepare('SELECT id FROM indicadores WHERE id = ?').get(req.params.id);
  if (!indicador) return res.status(404).json({ error: 'Indicador no encontrado.' });

  let { dato_registrado, estado } = req.body || {};
  if (estado && !ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido.' });
  }
  if (dato_registrado === undefined) dato_registrado = null;
  if (dato_registrado === '' ) dato_registrado = null;
  if (!estado) estado = dato_registrado ? 'sin_informacion' : 'sin_informacion';

  const universidadId = req.user.universidad_id;

  const existente = db.prepare(
    'SELECT id FROM valores_indicador WHERE universidad_id = ? AND indicador_id = ?'
  ).get(universidadId, indicador.id);

  if (existente) {
    db.prepare(`
      UPDATE valores_indicador
      SET dato_registrado = ?, estado = ?, actualizado_por = ?, actualizado_en = datetime('now')
      WHERE id = ?
    `).run(dato_registrado, estado, req.user.id, existente.id);
  } else {
    db.prepare(`
      INSERT INTO valores_indicador (universidad_id, indicador_id, dato_registrado, estado, actualizado_por)
      VALUES (?, ?, ?, ?, ?)
    `).run(universidadId, indicador.id, dato_registrado, estado, req.user.id);
  }

  res.json({ mensaje: 'Información guardada.' });
});

export default router;
