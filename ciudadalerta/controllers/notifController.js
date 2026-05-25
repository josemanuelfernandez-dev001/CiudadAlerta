const NotificacionModel = require('../models/notificacionModel');

exports.index = async (req, res) => {
  const notifs = await NotificacionModel.listarPorUsuario(req.session.usuario.id);
  res.render('perfil/notificaciones', { notifs });
};

exports.marcarLeida = async (req, res) => {
  await NotificacionModel.marcarLeida(req.params.id);
  res.redirect('/notificaciones');
};