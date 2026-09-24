import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth, requireRole } from '../auth.js';

const router = Router();
router.use(requireAuth, requireRole('responsable'));

function publicUser(u) {
  return { id: u.id, nombre: u.nombre, apellido: u.apellido, email: u.email, rol: u.rol, estado: u.estado, created_at: u.created_at };
}

router.get('/pendientes', (req, res) => {
  const pendientes = db.prepare(`
    SELECT * FROM usuarios WHERE universidad_id = ? AND estado = 'pendiente' ORDER BY created_at ASC
  `).all(req.user.universidad_id);
  res.json({ pendientes: pendientes.map(publicUser) });
});

router.post('/pendientes/:id/aprobar', (req, res) => {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ? AND universidad_id = ?').get(req.params.id, req.user.universidad_id);
  if (!usuario) return res.status(404).json({ error: 'Solicitud no encontrada.' });
  if (usuario.estado !== 'pendiente') return res.status(400).json({ error: 'Esta solicitud ya fue procesada.' });
  db.prepare("UPDATE usuarios SET estado = 'aprobada' WHERE id = ?").run(usuario.id);
  res.json({ mensaje: 'Solicitud aprobada.' });
});

router.post('/pendientes/:id/rechazar', (req, res) => {
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ? AND universidad_id = ?').get(req.params.id, req.user.universidad_id);
  if (!usuario) return res.status(404).json({ error: 'Solicitud no encontrada.' });
  if (usuario.estado !== 'pendiente') return res.status(400).json({ error: 'Esta solicitud ya fue procesada.' });
  db.prepare("UPDATE usuarios SET estado = 'rechazada' WHERE id = ?").run(usuario.id);
  res.json({ mensaje: 'Solicitud rechazada.' });
});

router.get('/usuarios', (req, res) => {
  const { q } = req.query;
  let sql = "SELECT * FROM usuarios WHERE universidad_id = ? AND estado = 'aprobada'";
  const params = [req.user.universidad_id];
  if (q) {
    sql += ' AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)';
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  sql += ' ORDER BY apellido ASC, nombre ASC';
  const usuarios = db.prepare(sql).all(...params);
  res.json({ usuarios: usuarios.map(publicUser) });
});

router.delete('/usuarios/:id', (req, res) => {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'Para eliminar tu propia cuenta usá la opción en Mi perfil.' });
  }
  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ? AND universidad_id = ?').get(req.params.id, req.user.universidad_id);
  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (usuario.rol === 'responsable') {
    return res.status(400).json({ error: 'No podés eliminar al Responsable Institucional desde aquí.' });
  }
  db.prepare('DELETE FROM usuarios WHERE id = ?').run(usuario.id);
  res.json({ mensaje: 'Usuario eliminado.' });
});

export default router;
