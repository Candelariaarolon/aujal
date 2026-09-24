import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const dimensiones = db.prepare(`
    SELECT d.id, d.codigo, d.nombre, d.orden, COUNT(i.id) AS total_indicadores
    FROM dimensiones d
    LEFT JOIN indicadores i ON i.dimension_id = d.id
    GROUP BY d.id
    ORDER BY d.orden ASC
  `).all();
  res.json({ dimensiones });
});

router.get('/:id/indicadores', requireAuth, (req, res) => {
  const dimension = db.prepare('SELECT id, codigo, nombre FROM dimensiones WHERE id = ?').get(req.params.id);
  if (!dimension) return res.status(404).json({ error: 'Dimensión no encontrada.' });
  const indicadores = db.prepare(`
    SELECT id, codigo, nombre, descripcion, formula, unidad, fuentes, es_ausjal
    FROM indicadores WHERE dimension_id = ? ORDER BY orden ASC
  `).all(dimension.id).map(i => ({ ...i, es_ausjal: !!i.es_ausjal }));
  res.json({ dimension, indicadores });
});

export default router;
