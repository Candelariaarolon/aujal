import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signToken, requireAuth } from '../auth.js';

const router = Router();

function publicUser(u) {
  return {
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    email: u.email,
    rol: u.rol,
    estado: u.estado,
    universidad_id: u.universidad_id,
  };
}

router.post('/registro', (req, res) => {
  const { nombre, apellido, email, universidad_id, password, confirmPassword } = req.body || {};

  if (!nombre || !apellido || !email || !universidad_id || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Completá todos los campos.' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const universidad = db.prepare('SELECT id FROM universidades WHERE id = ?').get(universidad_id);
  if (!universidad) {
    return res.status(400).json({ error: 'Universidad inválida.' });
  }

  const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
  if (existente) {
    return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const info = db.prepare(`
    INSERT INTO usuarios (nombre, apellido, email, password_hash, universidad_id, rol, estado)
    VALUES (?, ?, ?, ?, ?, 'institucional', 'pendiente')
  `).run(nombre.trim(), apellido.trim(), email.toLowerCase().trim(), passwordHash, universidad_id);

  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ mensaje: 'Cuenta creada. Tu solicitud quedó pendiente de aprobación.', usuario: publicUser(user) });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Ingresá tu correo y contraseña.' });
  }

  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email.toLowerCase().trim());
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  if (user.estado === 'pendiente') {
    return res.status(403).json({ error: 'Tu cuenta aún está pendiente de aprobación.', estado: 'pendiente' });
  }
  if (user.estado === 'rechazada') {
    return res.status(403).json({ error: 'Tu solicitud de acceso no fue aprobada.', estado: 'rechazada' });
  }

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales inválidas.' });
  }

  const token = signToken(user);
  res.json({ token, usuario: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  const universidad = db.prepare('SELECT id, nombre, pais, escudo_emoji FROM universidades WHERE id = ?').get(user.universidad_id);
  res.json({ usuario: publicUser(user), universidad });
});

export default router;
