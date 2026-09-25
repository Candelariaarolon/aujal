// Umbrales de referencia PROVISORIOS para clasificar automáticamente los
// indicadores numéricos que sí tienen una unidad de medida definida en el Excel
// de AUSJAL. El documento de requisitos deja explícitamente pendiente de
// validación con AUSJAL cuáles son los rangos/fórmulas reales por indicador
// (sección 21, punto 2) — estos valores son ilustrativos, pensados para que la
// plataforma funcione mientras se define el criterio oficial, y se editan acá
// sin tocar el resto de la app.
//
// mejorSiMenor: true  -> valores más bajos son mejores (ej: consumo per cápita)
// mejorSiMenor: false -> valores más altos son mejores (ej: % de vegetación)
// verde/amarillo/naranja son los "puntos de corte" en la dirección de mejora;
// lo que queda más allá del corte de "naranja" se clasifica como rojo.
export const UMBRALES_NUMERICOS = {
  'D06': { mejorSiMenor: true, verde: 30, amarillo: 50, naranja: 70 }, // % superficie construida
  'SI1-AUSJAL': { mejorSiMenor: false, verde: 40, amarillo: 25, naranja: 10 }, // % vegetación
  'SI2-AUSJAL': { mejorSiMenor: false, verde: 15, amarillo: 8, naranja: 3 }, // m² verde/persona
  'EC1-AUSJAL': { mejorSiMenor: true, verde: 500, amarillo: 1000, naranja: 1500 }, // kWh/persona/año
  'WS2-AUSJAL': { mejorSiMenor: true, verde: 20, amarillo: 40, naranja: 60 }, // kg residuos/persona/año
  'WR1-AUSJAL': { mejorSiMenor: true, verde: 15, amarillo: 25, naranja: 35 }, // m³ agua/persona/año
  'ED1-AUSJAL': { mejorSiMenor: false, verde: 30, amarillo: 15, naranja: 5 }, // N° publicaciones
  'ED3-AUSJAL': { mejorSiMenor: false, verde: 10, amarillo: 5, naranja: 2 }, // N° proyectos
  'GD2-AUSJAL': { mejorSiMenor: false, verde: 4, amarillo: 2, naranja: 1 }, // N° políticas
  'GD6-AUSJAL': { mejorSiMenor: false, verde: 3, amarillo: 2, naranja: 1 }, // N° rankings/redes
};

// Umbral GENÉRICO por defecto, para cualquier indicador numérico que no tenga
// una entrada propia arriba (por ejemplo, los indicadores "generales" del
// Excel que todavía no tienen fórmula/unidad definida por AUSJAL). Asume que
// "mayor es mejor" simplemente para que la plataforma muestre los 4 colores
// mientras se define el criterio real — no representa ninguna lógica de
// sustentabilidad específica. Ajustar o reemplazar por indicador en cuanto
// haya datos reales.
export const UMBRAL_GENERICO_POR_DEFECTO = { mejorSiMenor: false, verde: 75, amarillo: 50, naranja: 25 };
