const supabase = require('../config/supabase');

exports.crear = async (usuario_id, reporte_id, mensaje) => {
  const { error } = await supabase.from('notificaciones')
    .insert({ usuario_id, reporte_id, mensaje });
  if (error) throw error;
};

exports.listarPorUsuario = async (usuario_id) => {
  const { data, error } = await supabase
    .from('notificaciones')
    .select('*, reportes(titulo)')
    .eq('usuario_id', usuario_id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};

exports.marcarLeida = async (id) => {
  const { error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id);
  if (error) throw error;
};

exports.marcarLeidaPorUsuario = async (id, usuario_id) => {
  const { data, error } = await supabase
    .from('notificaciones')
    .update({ leida: true })
    .eq('id', id)
    .eq('usuario_id', usuario_id)
    .select('id');
  if (error) throw error;
  return Array.isArray(data) && data.length > 0;
};

exports.contarNoLeidas = async (usuario_id) => {
  const { count, error } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact' })
    .eq('usuario_id', usuario_id)
    .eq('leida', false);
  if (error) throw error;
  return count || 0;
};