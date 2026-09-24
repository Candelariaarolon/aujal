import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { seedIfEmpty } from './seed.js';

import authRoutes from './routes/auth.js';
import universidadesRoutes from './routes/universidades.js';
import dimensionesRoutes from './routes/dimensiones.js';
import indicadoresRoutes from './routes/indicadores.js';
import redRoutes from './routes/red.js';
import gestionUsuariosRoutes from './routes/gestion_usuarios.js';
import perfilRoutes from './routes/perfil.js';

seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/universidades', universidadesRoutes);
app.use('/api/dimensiones', dimensionesRoutes);
app.use('/api/indicadores', indicadoresRoutes);
app.use('/api/red', redRoutes);
app.use('/api/gestion-usuarios', gestionUsuariosRoutes);
app.use('/api/perfil', perfilRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`AUSJAL API escuchando en http://localhost:${PORT}`);
});
