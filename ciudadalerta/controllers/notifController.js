const NotificacionModel = require('../models/notificacionModel');

exports.index = async (req, res) => {
  try {
    const notifs = await NotificacionModel.listarPorUsuario(req.session.usuario.id);
    res.render('perfil/notificaciones', { notifs });
  } catch (e) {
    console.error('Error al listar notificaciones:', e);
    res.status(500).send('Error al cargar notificaciones');
  }
};

exports.marcarLeida = async (req, res) => {
  try {
    const ok = await NotificacionModel.marcarLeidaPorUsuario(
      req.params.id,
      req.session.usuario.id
    );
    if (!ok) return res.status(403).send('Acceso denegado');
    res.redirect('/notificaciones');
  } catch (e) {
    console.error('Error al marcar notificación como leída:', e);
    res.status(500).send('Error al actualizar notificación');
  }
};