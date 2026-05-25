const supabase = require('../config/supabase');
const ReporteModel = require('../models/reporteModel');

exports.index = (req, res) => {
  res.render('perfil/index', { usuario: req.session.usuario });
};

exports.misReportes = async (req, res) => {
  try {
    const { data: reportes } = await supabase.from('reportes')
      .select('*, categorias(nombre, color_hex)')
      .eq('usuario_id', req.session.usuario.id)
      .order('created_at', { ascending: false });
    res.render('perfil/mis-reportes', { reportes: reportes || [] });
  } catch (e) {
    res.status(500).send(e.message);
  }
};

exports.actualizar = async (req, res) => {
  const { nombre } = req.body;
  await supabase.from('usuarios')
    .update({ nombre }).eq('id', req.session.usuario.id);
  req.session.usuario.nombre = nombre;
  res.redirect('/perfil');
};