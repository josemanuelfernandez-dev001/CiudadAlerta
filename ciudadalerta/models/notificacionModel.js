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
  await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
};

exports.contarNoLeidas = async (usuario_id) => {
  const { count } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact' })
    .eq('usuario_id', usuario_id)
    .eq('leida', false);
  return count || 0;
};