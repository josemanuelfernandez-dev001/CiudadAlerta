module.exports = (req, res, next) => {
  if (!req.session.usuario || req.session.usuario.rol !== 'admin') {
    return res.status(403).send('Acceso denegado');
  }
  next();
};
