const supabase = require('../config/supabase');

exports.showLogin = (req, res) => {
  res.render('auth/login', { error: null });
};

exports.showRegister = (req, res) => {
  res.render('auth/register', { error: null });
};

exports.register = async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    if (!password || password.length < 8) {
      return res.render('auth/register', {
        error: 'La contraseña debe tener al menos 8 caracteres'
      });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email, password, email_confirm: true
    });
    if (error) return res.render('auth/register', { error: error.message });

    const { error: usuarioError } = await supabase.from('usuarios').insert({
      id: data.user.id, nombre, email, rol: 'ciudadano'
    });
    if (usuarioError) return res.render('auth/register', { error: usuarioError.message });

    res.redirect('/auth/login');
  } catch (e) {
    res.render('auth/register', { error: e.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, password
    });
    if (error) return res.render('auth/login', { error: error.message });

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .single();

    req.session.usuario = usuario;
    req.session.supabase_token = data.session.access_token;

    if (usuario.rol === 'admin') return res.redirect('/admin/dashboard');
    res.redirect('/reportes');
  } catch (e) {
    res.render('auth/login', { error: e.message });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/auth/login'));
};