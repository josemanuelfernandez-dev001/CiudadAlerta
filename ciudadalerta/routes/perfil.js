const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/perfilController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);
router.get('/', ctrl.index);
router.get('/mis-reportes', ctrl.misReportes);
router.post('/', ctrl.actualizar);

module.exports = router;
