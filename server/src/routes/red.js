import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

const router = Router();

function distribucion(rows) {
  const total = rows.length;
  const conteo = { verde: 0, amarillo: 0, naranja: 0, rojo: 0 };
  rows.forEach(r => { if (conteo[r.estado] !== undefined) conteo[r.estado]++; });
  if (total === 0) return { total: 0, porcentajes: { verde: 0, amarillo: 0, naranja: 0, rojo: 0 } };
  const porcentajes = {};
  Object.keys(conteo).forEach(k => { porcentajes[k] = Math.round((conteo[k] / total) * 100); });
  return { total, porcentajes };
}

router.get('/resumen', requireAuth, (req, res) => {
  const totalUniversidades = db.prepare('SELECT COUNT(*) c FROM universidades').get().c;
  const totalIndicadores = db.prepare('SELECT COUNT(*) c FROM indicadores').get().c;
  const totalEsperado = totalUniversidades * totalIndicadores;

  const valores = db.prepare('SELECT indicador_id, universidad_id, dato_registrado, estado FROM valores_indicador').all();

  const conDato = valores.filter(v => v.dato_registrado !== null && v.dato_registrado !== '').length;
  const cobertura = totalEsperado > 0 ? Math.round((conDato / totalEsperado) * 100) : 0;

  const evaluados = valores.filter(v => v.estado !== 'sin_informacion');
  const estadoIndicadores = distribucion(evaluados);

  const dimensiones = db.prepare('SELECT id, nombre, orden FROM dimensiones ORDER BY orden ASC').all();
  const indicadoresPorDimension = db.prepare('SELECT id, dimension_id FROM indicadores').all();
  const dimensionDeIndicador = new Map(indicadoresPorDimension.map(i => [i.id, i.dimension_id]));

  const porDimension = dimensiones.map(dim => {
    const rowsDim = evaluados.filter(v => dimensionDeIndicador.get(v.indicador_id) === dim.id);
    return { dimension: dim.nombre, ...distribucion(rowsDim) };
  });

  const universidades = db.prepare('SELECT id, nombre, pais, escudo_emoji FROM universidades ORDER BY nombre ASC').all();

  res.json({
    cobertura,
    meta_cobertura: 100,
    estado_indicadores: estadoIndicadores,
    por_dimension: porDimension,
    universidades,
    total_universidades: totalUniversidades,
    total_indicadores: totalIndicadores,
  });
});

export default router;
