const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/adminController');
const requireAdmin = require('../middleware/requireAdmin');

router.use(requireAdmin);

router.get('/dashboard', ctrl.dashboard);
router.get('/reportes', ctrl.listarReportes);
router.post('/reportes/:id/estado', ctrl.updateEstado);
router.post('/reportes/:id/eliminar', ctrl.eliminarReporte);
router.get('/categorias', ctrl.listarCategorias);
router.post('/categorias', ctrl.crearCategoria);
router.post('/categorias/:id', ctrl.actualizarCategoria);

module.exports = router;
