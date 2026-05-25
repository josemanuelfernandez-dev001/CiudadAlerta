const supabase = require('../config/supabase');

exports.listarActivas = async () => {
  const { data, error } = await supabase
    .from('categorias').select('*').eq('activa', true);
  if (error) throw error;
  return data;
};

exports.listarTodas = async () => {
  const { data, error } = await supabase
    .from('categorias').select('*').order('nombre');
  if (error) throw error;
  return data;
};

exports.crear = async (datos) => {
  const { data, error } = await supabase
    .from('categorias').insert(datos).select().single();
  if (error) throw error;
  return data;
};

exports.actualizar = async (id, datos) => {
  const { data, error } = await supabase
    .from('categorias').update(datos).eq('id', id).select().single();
  if (error) throw error;
  return data;
};

exports.desactivar = async (id) => {
  const { error } = await supabase
    .from('categorias').update({ activa: false }).eq('id', id);
  if (error) throw error;
};