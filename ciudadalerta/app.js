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
  cookie: { maxAge: 1000 * 60 * 60 * 8 }
}));

// Hacer el usuario disponible en todas las vistas
app.use((req, res, next) => {
  res.locals.usuario = req.session.usuario || null;
  next();
});

app.use('/auth',           authRoutes);
app.use('/reportes',       reporteRoutes);
app.use('/admin',          adminRoutes);
app.use('/perfil',         perfilRoutes);
app.use('/notificaciones', notifRoutes);

app.get('/', (req, res) => res.redirect('/reportes'));

app.listen(process.env.PORT || 3000, () => {
  console.log('CiudadAlerta corriendo en puerto ' + process.env.PORT);
});
