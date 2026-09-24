export const ESTADOS = {
  verde: { label: 'Verde', color: '#2f9e44', bg: '#ebfbee', emoji: '🟢' },
  amarillo: { label: 'Amarillo', color: '#e8a400', bg: '#fff9db', emoji: '🟡' },
  naranja: { label: 'Naranja', color: '#e8590c', bg: '#fff4e6', emoji: '🟠' },
  rojo: { label: 'Rojo', color: '#e03131', bg: '#fff5f5', emoji: '🔴' },
  sin_informacion: { label: 'Sin información', color: '#868e96', bg: '#f1f3f5', emoji: '⚪' },
};

export const ORDEN_ESTADOS = ['verde', 'amarillo', 'naranja', 'rojo', 'sin_informacion'];

export function estadoInfo(estado) {
  return ESTADOS[estado] || ESTADOS.sin_informacion;
}
