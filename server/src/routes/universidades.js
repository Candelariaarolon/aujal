import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

// Endpoint público (sin autenticación): necesario para el selector de universidad
// en la pantalla de creación de cuenta, antes de que la persona tenga sesión.
router.get('/publicas', (req, res) => {
  const universidades = db.prepare('SELECT id, nombre, pais FROM universidades ORDER BY nombre ASC').all();
  res.json({ universidades });
});

router.get('/', requireAuth, (req, res) => {
  const { q, pais } = req.query;
  let sql = 'SELECT id, nombre, pais, escudo_emoji FROM universidades WHERE 1=1';
  const params = [];
  if (q) {
    sql += ' AND nombre LIKE ?';
    params.push(`%${q}%`);
  }
  if (pais) {
    sql += ' AND pais = ?';
    params.push(pais);
  }
  sql += ' ORDER BY nombre ASC';
  const universidades = db.prepare(sql).all(...params);
  res.json({ universidades });
});

router.get('/paises', requireAuth, (req, res) => {
  const paises = db.prepare('SELECT DISTINCT pais FROM universidades ORDER BY pais ASC').all().map(r => r.pais);
  res.json({ paises });
});

router.get('/:id', requireAuth, (req, res) => {
  const universidad = db.prepare('SELECT id, nombre, pais, escudo_emoji FROM universidades WHERE id = ?').get(req.params.id);
  if (!universidad) return res.status(404).json({ error: 'Universidad no encontrada.' });

  const dimensiones = db.prepare('SELECT id, codigo, nombre, orden FROM dimensiones ORDER BY orden ASC').all();
  const indicadores = db.prepare('SELECT * FROM indicadores ORDER BY dimension_id ASC, orden ASC').all();
  const valores = db.prepare('SELECT * FROM valores_indicador WHERE universidad_id = ?').all(universidad.id);
  const valoresPorIndicador = new Map(valores.map(v => [v.indicador_id, v]));

  const dimensionesConIndicadores = dimensiones.map(dim => {
    const inds = indicadores
      .filter(i => i.dimension_id === dim.id)
      .map(i => {
        const valor = valoresPorIndicador.get(i.id);
        return {
          id: i.id,
          codigo: i.codigo,
          nombre: i.nombre,
          descripcion: i.descripcion,
          formula: i.formula,
          unidad: i.unidad,
          fuentes: i.fuentes,
          es_ausjal: !!i.es_ausjal,
          dato_registrado: valor ? valor.dato_registrado : null,
          estado: valor ? valor.estado : 'sin_informacion',
        };
      });
    return { id: dim.id, codigo: dim.codigo, nombre: dim.nombre, indicadores: inds };
  });

  const totalIndicadores = indicadores.length;
  const conDato = valores.filter(v => v.dato_registrado !== null && v.dato_registrado !== '').length;
  const cobertura = totalIndicadores > 0 ? Math.round((conDato / totalIndicadores) * 100) : 0;

  res.json({
    universidad,
    cobertura,
    dimensiones: dimensionesConIndicadores,
    es_mi_universidad: req.user.universidad_id === universidad.id,
  });
});

export default router;
