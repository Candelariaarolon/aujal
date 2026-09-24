import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, transaction } from '../db.js';
import { requireAuth, requireRole, signToken } from '../auth.js';

const router = Router();
router.use(requireAuth);

router.put('/', (req, res) => {
  const { nombre, apellido, email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

  if (email && email.toLowerCase().trim() !== user.email) {
    const existente = db.prepare('SELECT id FROM usuarios WHERE email = ? AND id != ?').get(email.toLowerCase().trim(), user.id);
    if (existente) return res.status(409).json({ error: 'Ya existe una cuenta con ese correo electrónico.' });
  }
  if (password && password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const nuevoNombre = nombre?.trim() || user.nombre;
  const nuevoApellido = apellido?.trim() || user.apellido;
  const nuevoEmail = email?.toLowerCase().trim() || user.email;
  const nuevoHash = password ? bcrypt.hashSync(password, 10) : user.password_hash;

  db.prepare('UPDATE usuarios SET nombre = ?, apellido = ?, email = ?, password_hash = ? WHERE id = ?')
    .run(nuevoNombre, nuevoApellido, nuevoEmail, nuevoHash, user.id);

  res.json({ mensaje: 'Perfil actualizado.' });
});

router.delete('/', (req, res) => {
  const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (user.rol === 'responsable') {
    return res.status(400).json({ error: 'Primero debés transferir tu rol de Responsable Institucional a otro usuario.' });
  }
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(user.id);
  res.json({ mensaje: 'Cuenta eliminada.' });
});

router.post('/transferir-rol', requireRole('responsable'), (req, res) => {
  const { nuevo_responsable_id } = req.body || {};
  const candidato = db.prepare(`
    SELECT * FROM usuarios WHERE id = ? AND universidad_id = ? AND rol = 'institucional' AND estado = 'aprobada'
  `).get(nuevo_responsable_id, req.user.universidad_id);
  if (!candidato) {
    return res.status(400).json({ error: 'El usuario seleccionado no es válido para recibir el rol.' });
  }

  transaction(() => {
    db.prepare("UPDATE usuarios SET rol = 'institucional' WHERE id = ?").run(req.user.id);
    db.prepare("UPDATE usuarios SET rol = 'responsable' WHERE id = ?").run(candidato.id);
  });

  const actualizado = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id);
  const token = signToken(actualizado);

  res.json({
    mensaje: `El rol de Responsable Institucional fue transferido a ${candidato.nombre} ${candidato.apellido}.`,
    token,
  });
});

export default router;
