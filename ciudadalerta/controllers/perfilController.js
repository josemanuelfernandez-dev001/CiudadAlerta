const supabase = require('../config/supabase');

exports.index = (req, res) => {
  res.render('citizen/perfil/index', { usuario: req.session.usuario });
};

exports.misReportes = async (req, res) => {
  try {
    const { data: reportes, error } = await supabase.from('reportes')
      .select('*, categorias(nombre, color_hex)')
      .eq('usuario_id', req.session.usuario.id)
      .order('created_at', { ascending: false });
    if (error) throw error;

    res.render('citizen/perfil/mis-reportes', { reportes: reportes || [] });
  } catch (e) {
    console.error('Error al listar mis reportes:', e);
    res.status(500).send('Error al cargar reportes');
  }
};

exports.actualizar = async (req, res) => {
  const { nombre } = req.body;
  try {
    const { error } = await supabase.from('usuarios')
      .update({ nombre })
      .eq('id', req.session.usuario.id);
    if (error) throw error;

    req.session.usuario.nombre = nombre;
    res.redirect('/perfil');
  } catch (e) {
    console.error('Error al actualizar perfil:', e);
    res.status(500).send('Error al actualizar perfil');
  }
};