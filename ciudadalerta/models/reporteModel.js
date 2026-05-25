const supabase = require('../config/supabase');

exports.crear = async (datos) => {
  const { data, error } = await supabase
    .from('reportes').insert(datos).select().single();
  if (error) throw error;
  return data;
};

exports.listar = async (filtros = {}) => {
  let query = supabase.from('reportes')
    .select(`*, categorias(nombre, color_hex, competencia),
             usuarios(nombre),
             votos(count)`)
    .order('created_at', { ascending: false });

  if (filtros.estado) query = query.eq('estado', filtros.estado);
  if (filtros.categoria_id) query = query.eq('categoria_id', filtros.categoria_id);
  if (filtros.zona) {
    const zona = String(filtros.zona).replace(/[%_]/g, '\\$&').trim();
    query = query.ilike('zona', '%' + zona + '%');
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

exports.buscarPorId = async (id) => {
  const { data, error } = await supabase
    .from('reportes')
    .select(`*, categorias(nombre, color_hex, competencia),
             usuarios(nombre, email),
             fotos_reporte(url_imagen),
             historial_estados(estado_anterior, estado_nuevo,
               comentario, created_at, usuarios(nombre)),
             votos(usuario_id)`)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

exports.actualizar = async (id, datos) => {
  const { data, error } = await supabase
    .from('reportes').update(datos).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

exports.eliminar = async (id) => {
  const { error } = await supabase.from('reportes').delete().eq('id', id);
  if (error) throw error;
};

exports.contarVotos = async (reporte_id) => {
  const { count } = await supabase
    .from('votos').select('*', { count: 'exact' })
    .eq('reporte_id', reporte_id);
  return count || 0;
};