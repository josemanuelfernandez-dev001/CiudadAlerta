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
    const notifs = await NotificacionModel.listarPorUsuario(req.session.usuario.id);
    const notificacion = notifs.find(n => String(n.id) === String(req.params.id));
    if (!notificacion) return res.status(403).send('Acceso denegado');

    await NotificacionModel.marcarLeida(req.params.id);
    res.redirect('/notificaciones');
  } catch (e) {
    console.error('Error al marcar notificación como leída:', e);
    res.status(500).send('Error al actualizar notificación');
  }
};