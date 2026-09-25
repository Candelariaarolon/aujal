import { UMBRALES_NUMERICOS, UMBRAL_GENERICO_POR_DEFECTO } from './umbrales.js';

// Calcula el estado (semáforo) de un indicador de forma automática a partir del
// dato registrado. El Responsable Institucional ya no elige el color: solo
// carga el dato, y esta función decide el estado según reglas objetivas.
//
// Orden de prioridad:
// 1. Indicadores "Existe/No" (según la unidad definida en el Excel): binario.
// 2. Indicadores con umbral numérico específico configurado en umbrales.js.
// 3. Cualquier otro indicador: se intenta interpretar el dato como Existe/No
//    (muchos indicadores generales están redactados como "¿existe un
//    programa...?" aunque el Excel no les haya definido una unidad formal) y,
//    si no, se aplica un umbral numérico GENÉRICO por defecto.
//
// Los umbrales de los pasos 2 y 3 son provisorios/ilustrativos (ver
// umbrales.js): AUSJAL todavía no validó los criterios reales por indicador.
export function calcularEstado(indicador, datoRegistrado) {
  const dato = (datoRegistrado ?? '').toString().trim();
  if (!dato) return 'sin_informacion';

  const unidad = indicador.unidad || '';

  if (unidad.includes('Existe/No')) {
    return clasificarExisteNo(dato) ?? 'sin_informacion';
  }

  const umbral = UMBRALES_NUMERICOS[indicador.codigo];
  if (umbral) {
    const numero = extraerNumero(dato);
    if (numero === null) return 'sin_informacion';
    return clasificarNumerico(numero, umbral);
  }

  const existeNo = clasificarExisteNo(dato);
  if (existeNo) return existeNo;

  const numero = extraerNumero(dato);
  if (numero !== null) return clasificarNumerico(numero, UMBRAL_GENERICO_POR_DEFECTO);

  return 'sin_informacion';
}

function clasificarExisteNo(dato) {
  const texto = dato.toLowerCase().trim();
  if (texto.startsWith('no') || texto.includes('no existe')) return 'rojo';
  if (texto.includes('existe') || texto === 'sí' || texto === 'si') return 'verde';
  return null;
}

function extraerNumero(dato) {
  const match = dato.replace(',', '.').match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

function clasificarNumerico(valor, { mejorSiMenor, verde, amarillo, naranja }) {
  if (mejorSiMenor) {
    if (valor <= verde) return 'verde';
    if (valor <= amarillo) return 'amarillo';
    if (valor <= naranja) return 'naranja';
    return 'rojo';
  }
  if (valor >= verde) return 'verde';
  if (valor >= amarillo) return 'amarillo';
  if (valor >= naranja) return 'naranja';
  return 'rojo';
}
