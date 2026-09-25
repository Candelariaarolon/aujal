import { UMBRALES_NUMERICOS } from './umbrales.js';

// Calcula el estado (semáforo) de un indicador de forma automática a partir del
// dato registrado. El Responsable Institucional ya no elige el color: solo
// carga el dato, y esta función decide el estado según reglas objetivas.
//
// Si un indicador todavía no tiene una regla definida (no es de tipo
// "Existe/No" ni tiene un umbral numérico configurado en umbrales.js), se
// devuelve "sin_informacion" sin importar lo que se haya cargado: el documento
// de requisitos es explícito en que no hay que inventar criterios de
// evaluación hasta que AUSJAL los valide.
export function calcularEstado(indicador, datoRegistrado) {
  const dato = (datoRegistrado ?? '').toString().trim();
  if (!dato) return 'sin_informacion';

  const unidad = indicador.unidad || '';

  if (unidad.includes('Existe/No')) {
    return clasificarExisteNo(dato);
  }

  const umbral = UMBRALES_NUMERICOS[indicador.codigo];
  if (umbral) {
    const numero = extraerNumero(dato);
    if (numero === null) return 'sin_informacion';
    return clasificarNumerico(numero, umbral);
  }

  return 'sin_informacion';
}

function clasificarExisteNo(dato) {
  const texto = dato.toLowerCase();
  if (texto.startsWith('no') || texto.includes('no existe')) return 'rojo';
  if (texto.includes('existe')) return 'verde';
  return 'sin_informacion';
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
