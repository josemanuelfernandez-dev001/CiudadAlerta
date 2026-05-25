const supabase = require('../config/supabase');
const ReporteModel = require('../models/reporteModel');
const CategoriaModel = require('../models/categoriaModel');
const NotificacionModel = require('../models/notificacionModel');

exports.dashboard = async (req, res) => {
  try {
    const [totalRes] = await Promise.all([
      supabase.from('reportes').select(`estado, zona, categoria_id, created_at,
        categorias(nombre)`, { count: 'exact' })
    ]);

    const reportes = totalRes.data || [];
    const stats = {
      total: reportes.length,
      pendientes: reportes.filter(r => r.estado === 'pendiente').length,
      en_proceso: reportes.filter(r => r.estado === 'en_proceso').length,
      resueltos: reportes.filter(r => r.estado === 'resuelto').length,
      rechazados: reportes.filter(r => r.estado === 'rechazado').length
    };

    const { data: antiguos } = await supabase.from('reportes')
      .select('id, titulo, zona, created_at')
      .eq('estado', 'pendiente')
      .order('created_at', { ascending: true })
      .limit(5);

    res.render('admin/dashboard', { stats, antiguos: antiguos || [] });
  } catch (e) {
    console.error('Error en dashboard admin:', e);
    res.status(500).send('Error al cargar dashboard');
  }
};

exports.listarReportes = async (req, res) => {
  try {
    const filtros = {
      estado: req.query.estado || null,
      categoria_id: req.query.categoria_id || null,
      zona: req.query.zona || null
    };
    const reportes = await ReporteModel.listar(filtros);
    const categorias = await CategoriaModel.listarTodas();
    res.render('admin/reportes', { reportes, categorias, filtros });
  } catch (e) {
    console.error('Error al listar reportes admin:', e);
    res.status(500).send('Error al listar reportes');
  }
};

exports.updateEstado = async (req, res) => {
  const { estado, comentario, area_asignada } = req.body;
  const reporte_id = req.params.id;
  const admin_id = req.session.usuario.id;
  try {
    const reporte = await ReporteModel.buscarPorId(reporte_id);

    await supabase.from('historial_estados').insert({
      reporte_id,
      estado_anterior: reporte.estado,
      estado_nuevo: estado,
      admin_id,
      comentario
    });

    await ReporteModel.actualizar(reporte_id, {
      estado,
      area_asignada,
      updated_at: new Date()
    });

    const mensajes = {
      en_proceso: 'Tu reporte fue recibido y está siendo atendido.',
      resuelto: 'Tu reporte ha sido marcado como resuelto.',
      rechazado: 'Tu reporte fue revisado y no procede: ' + (comentario || '')
    };
    if (mensajes[estado] && reporte.usuario_id) {
      await NotificacionModel.crear(
        reporte.usuario_id, reporte_id, mensajes[estado]
      );
    }
    res.redirect('/admin/reportes');
  } catch (e) {
    console.error('Error al actualizar estado de reporte:', e);
    res.status(500).send('Error al actualizar estado');
  }
};

exports.eliminarReporte = async (req, res) => {
  await ReporteModel.eliminar(req.params.id);
  res.redirect('/admin/reportes');
};

exports.listarCategorias = async (req, res) => {
  const categorias = await CategoriaModel.listarTodas();
  res.render('admin/categorias', { categorias, error: null });
};

exports.crearCategoria = async (req, res) => {
  const { nombre, icono, color_hex, competencia } = req.body;
  await CategoriaModel.crear({ nombre, icono, color_hex, competencia });
  res.redirect('/admin/categorias');
};

exports.actualizarCategoria = async (req, res) => {
  const { nombre, icono, color_hex, competencia, activa } = req.body;
  await CategoriaModel.actualizar(req.params.id, {
    nombre,
    icono,
    color_hex,
    competencia,
    activa: activa === 'true'
  });
  res.redirect('/admin/categorias');
};