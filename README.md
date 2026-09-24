# Plataforma de Indicadores de Sustentabilidad — AUSJAL

MVP funcional basado en "Relevamiento de requisitos - Proyecto AUSJAL" y en los 58
indicadores del Excel `indicadores.xlsx`, organizados en 9 dimensiones.

## Estructura

```
server/   API REST (Node.js + Express + SQLite vía node:sqlite, JWT, bcrypt)
client/   Frontend (React + Vite + React Router)
```

## Cómo correrlo

Backend (puerto 4000; crea y siembra la base de datos SQLite en `server/data/` la
primera vez que se ejecuta):

```bash
cd server
npm install
npm start
```

Frontend (puerto 5173, con proxy de `/api` hacia el backend):

```bash
cd client
npm install
npm run dev
```

Abrir http://localhost:5173

## Usuarios precargados

Cada universidad se crea con un **Responsable Institucional** ya aprobado. Las
credenciales completas (una por universidad) quedan en:

```
server/data/credenciales_iniciales.csv
```

La contraseña de todos es `Ausjal2026!`. Los "Usuarios Institucionales" adicionales
se crean vía "Crear cuenta" y quedan pendientes de aprobación por el Responsable de
esa universidad.

## Qué implementa (según el documento de requisitos)

- Roles: Responsable Institucional / Usuario Institucional, con los permisos
  descriptos en la sección 4 del documento.
- Login con estados de cuenta (pendiente / aprobada / rechazada) y sus mensajes.
- Alta de cuenta con aprobación por el Responsable de la universidad elegida.
- Inicio: estado de indicadores reportados (semáforo), cobertura de información
  (separada del semáforo), estado agregado por dimensión, universidades participantes.
- Universidades: buscador + filtro por país.
- Perfil institucional / Mi universidad, con indicadores agrupados por dimensión.
- Gestionar indicadores (solo Responsable, solo su propia universidad), con carga
  parcial y sin sistema de borradores.
- Comparar indicadores: dimensión → indicador → agrupación por estado (sin rankings).
- Gestión de usuarios: solicitudes pendientes, aprobar/rechazar, listado y
  eliminación de usuarios de la propia institución.
- Transferencia obligatoria del rol de Responsable antes de poder eliminar la cuenta.
- Mi perfil: edición de datos propios y eliminación de cuenta (sin afectar los datos
  institucionales).

## Decisiones tomadas sobre los dos puntos pendientes de validación (sección 21)

El documento deja explícitamente abiertas dos definiciones. Para tener un MVP
funcional se resolvieron así, de forma que sea fácil reemplazarlas cuando AUSJAL
las valide:

1. **Períodos e historial:** se implementó un único valor "vigente" por indicador
   y universidad (se sobrescribe al actualizar). El esquema (`valores_indicador`)
   ya aísla el dato por universidad + indicador, así que agregar períodos más
   adelante implica sumar una columna `periodo` y dejar de usar `UNIQUE(universidad_id, indicador_id)`
   como clave, sin rehacer el resto del modelo.

2. **Criterios de color:** como todavía no existen fórmulas/rangos por indicador,
   el color (🟢🟡🟠🔴⚪) se define **manualmente** por el Responsable Institucional
   al cargar cada dato (no se inventó ningún umbral). Cuando AUSJAL defina las
   fórmulas reales, ese select se puede reemplazar por un cálculo automático en
   `server/src/routes/indicadores.js` sin tocar el resto de la app.

## Nota sobre las universidades precargadas

La lista de universidades en `server/src/universidades.json` es una aproximación
razonable de la Red AUSJAL a modo de dato de ejemplo. Antes de un uso real conviene
que el representante del proyecto la revise/complete (nombres exactos, escudos,
etc.).
