const supabase = require('../config/supabase');

exports.buscarPorId = async (id) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

exports.buscarPorEmail = async (email) => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('email', email)
    .single();
  if (error) throw error;
  return data;
};

exports.listar = async () => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

exports.crear = async ({ id, nombre, email, rol = 'ciudadano' }) => {
  const { data, error } = await supabase
    .from('usuarios')
    .insert({ id, nombre, email, rol })
    .select()
    .single();
  if (error) throw error;
  return data;
};

exports.actualizar = async (id, datos) => {
  const { data, error } = await supabase
    .from('usuarios')
    .update(datos)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
};
