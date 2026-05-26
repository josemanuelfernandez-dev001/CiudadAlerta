require('dotenv').config();
const express     = require('express');
const session     = require('express-session');
const cookieParser = require('cookie-parser');
const path        = require('path');

const authRoutes   = require('./routes/auth');
const reporteRoutes = require('./routes/reportes');
const adminRoutes  = require('./routes/admin');
const perfilRoutes = require('./routes/perfil');
const notifRoutes  = require('./routes/notificaciones');

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET no está definido en el archivo .env');
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 8,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Hacer el usuario disponible en todas las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  res.locals.currentPath = req.path;
  next();
});

app.use('/auth',           authRoutes);
app.use('/reportes',       reporteRoutes);
app.use('/admin',          adminRoutes);
app.use('/perfil',         perfilRoutes);
app.use('/notificaciones', notifRoutes);

app.get('/', (req, res) => res.redirect('/reportes'));

app.listen(port, () => {
  console.log('CiudadAlerta corriendo en puerto ' + port);
});
