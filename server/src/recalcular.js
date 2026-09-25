// Recalcula el estado de todos los valores ya cargados, usando las reglas
// automáticas de reglas_estado.js. Útil para aplicar cambios en umbrales.js
// (o esta migración puntual) sobre datos ya existentes, sin perder los datos
// registrados por las universidades.
import { db } from './db.js';
import { calcularEstado } from './reglas_estado.js';

const indicadores = new Map(
  db.prepare('SELECT id, codigo, unidad FROM indicadores').all().map(i => [i.id, i])
);

const valores = db.prepare('SELECT id, indicador_id, dato_registrado, estado FROM valores_indicador').all();
const update = db.prepare('UPDATE valores_indicador SET estado = ? WHERE id = ?');

let cambiados = 0;
for (const v of valores) {
  const indicador = indicadores.get(v.indicador_id);
  const nuevoEstado = calcularEstado(indicador, v.dato_registrado);
  if (nuevoEstado !== v.estado) {
    update.run(nuevoEstado, v.id);
    cambiados++;
  }
}

console.log(`Recalculado: ${cambiados} de ${valores.length} valores cambiaron de estado.`);
