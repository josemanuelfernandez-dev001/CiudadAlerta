const supabase = require('../config/supabase');
const path = require('path');
const crypto = require('crypto');
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
  } catch (e) {
    console.error('Error al cargar reportes:', e);
    res.status(500).send('Error al cargar reportes');
  }
};

exports.mapa = async (req, res) => {
  try {
    const reportes = await ReporteModel.listar();
    const categorias = await CategoriaModel.listarActivas();
    res.render('reportes/mapa', { reportes, categorias });
  } catch (e) {
    console.error('Error al cargar mapa:', e);
    res.status(500).send('Error al cargar mapa');
  }
};

exports.nuevo = async (req, res) => {
  try {
    const categorias = await CategoriaModel.listarActivas();
    res.render('reportes/nuevo', { categorias, error: null });
  } catch (e) {
    console.error('Error al cargar formulario:', e);
    res.status(500).send('Error al cargar formulario');
  }
};

exports.store = async (req, res) => {
  const { titulo, descripcion, categoria_id, latitud, longitud, zona } = req.body;
  const usuario_id = req.session.usuario.id;
  const lat = parseFloat(latitud);
  const lng = parseFloat(longitud);
  try {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error('Coordenadas inválidas');
    }

    const reporte = await ReporteModel.crear({
      titulo, descripcion, categoria_id, latitud: lat,
      longitud: lng, zona, usuario_id, estado: 'pendiente'
    });

    // Subir fotos si existen
    if (req.files && req.files.length > 0) {
      const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
      const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];
      for (const file of req.files) {
        const baseName = path.basename(file.originalname);
        const ext = path.extname(baseName).toLowerCase();
        if (!allowedExt.includes(ext) || !allowedMime.includes(file.mimetype)) continue;
        const filename = Date.now() + '_' + crypto.randomUUID() + ext;
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
    console.error('Error al crear reporte:', e);
    const categorias = await CategoriaModel.listarActivas();
    res.render('reportes/nuevo', { categorias, error: 'No se pudo crear el reporte' });
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
  } catch (e) {
    if (e && e.code === 'PGRST116') return res.status(404).send('Reporte no encontrado');
    console.error('Error al cargar detalle de reporte:', e);
    res.status(500).send('Error al cargar reporte');
  }
};

exports.update = async (req, res) => {
  const { titulo, descripcion, categoria_id, zona } = req.body;
  try {
    await ReporteModel.actualizar(req.params.id,
      { titulo, descripcion, categoria_id, zona, updated_at: new Date() });
    res.redirect('/reportes/' + req.params.id);
  } catch (e) {
    console.error('Error al actualizar reporte:', e);
    res.status(500).send('Error al actualizar reporte');
  }
};

exports.votar = async (req, res) => {
  const usuario_id = req.session.usuario.id;
  const reporte_id = req.params.id;
  try {
    await supabase.from('votos').insert({ reporte_id, usuario_id });
    res.redirect('/reportes/' + reporte_id);
  } catch (e) {
    console.error('Error al votar reporte:', e);
    res.redirect('/reportes/' + reporte_id);
  }
};

exports.quitarVoto = async (req, res) => {
  const usuario_id = req.session.usuario.id;
  const reporte_id = req.params.id;
  try {
    await supabase.from('votos')
      .delete().eq('reporte_id', reporte_id).eq('usuario_id', usuario_id);
  } catch (e) {
    console.error('Error al quitar voto:', e);
  }
  res.redirect('/reportes/' + reporte_id);
};