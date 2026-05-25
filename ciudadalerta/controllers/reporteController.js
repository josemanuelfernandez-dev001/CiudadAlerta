const supabase = require('../config/supabase');
const ReporteModel = require('../models/reporteModel');
const CategoriaModel = require('../models/categoriaModel');

exports.index = async (req, res) => {
  try {
    const filtros = {
      estado: req.query.estado || null,
      categoria_id: req.query.categoria_id || null,
      zona: req.query.zona || null
    };
    const reportes = await ReporteModel.listar(filtros);
    const categorias = await CategoriaModel.listarActivas();
    res.render('reportes/index', { reportes, categorias, filtros });
  } catch (e) { res.status(500).send('Error al cargar reportes'); }
};

exports.mapa = async (req, res) => {
  try {
    const reportes = await ReporteModel.listar();
    const categorias = await CategoriaModel.listarActivas();
    res.render('reportes/mapa', { reportes, categorias });
  } catch (e) { res.status(500).send(e.message); }
};

exports.nuevo = async (req, res) => {
  try {
    const categorias = await CategoriaModel.listarActivas();
    res.render('reportes/nuevo', { categorias, error: null });
  } catch (e) {
    res.status(500).send('Error al cargar formulario');
  }
};

exports.store = async (req, res) => {
  const { titulo, descripcion, categoria_id, latitud, longitud, zona } = req.body;
  const usuario_id = req.session.usuario.id;
  try {
    const reporte = await ReporteModel.crear({
      titulo, descripcion, categoria_id, latitud: parseFloat(latitud),
      longitud: parseFloat(longitud), zona, usuario_id, estado: 'pendiente'
    });

    // Subir fotos si existen
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const safeOriginalName = file.originalname
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/_+/g, '_');
        const filename = Date.now() + '_' + safeOriginalName;
        await supabase.storage.from('fotos-reportes')
          .upload(filename, file.buffer, { contentType: file.mimetype });
        const { data: { publicUrl } } = supabase.storage
          .from('fotos-reportes').getPublicUrl(filename);
        await supabase.from('fotos_reporte')
          .insert({ reporte_id: reporte.id, url_imagen: publicUrl });
      }
    }
    res.redirect('/reportes/' + reporte.id);
  } catch (e) {
    const categorias = await CategoriaModel.listarActivas();
    res.render('reportes/nuevo', { categorias, error: e.message });
  }
};

exports.show = async (req, res) => {
  try {
    const reporte = await ReporteModel.buscarPorId(req.params.id);
    const usuario = req.session.usuario;
    const yaVoto = usuario
      ? reporte.votos.some(v => v.usuario_id === usuario.id)
      : false;
    res.render('reportes/detalle', { reporte, usuario, yaVoto });
  } catch (e) { res.status(404).send('Reporte no encontrado'); }
};

exports.update = async (req, res) => {
  const { titulo, descripcion, categoria_id, zona } = req.body;
  try {
    await ReporteModel.actualizar(req.params.id,
      { titulo, descripcion, categoria_id, zona, updated_at: new Date() });
    res.redirect('/reportes/' + req.params.id);
  } catch (e) { res.status(500).send('Error al actualizar reporte'); }
};

exports.votar = async (req, res) => {
  const usuario_id = req.session.usuario.id;
  const reporte_id = req.params.id;
  try {
    await supabase.from('votos').insert({ reporte_id, usuario_id });
    res.redirect('/reportes/' + reporte_id);
  } catch (e) { res.redirect('/reportes/' + reporte_id); }
};

exports.quitarVoto = async (req, res) => {
  const usuario_id = req.session.usuario.id;
  const reporte_id = req.params.id;
  try {
    await supabase.from('votos')
      .delete().eq('reporte_id', reporte_id).eq('usuario_id', usuario_id);
  } catch (e) {
    return res.redirect('/reportes/' + reporte_id);
  }
  res.redirect('/reportes/' + reporte_id);
};