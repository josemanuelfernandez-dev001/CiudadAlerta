const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reporteController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../middleware/upload');

router.get('/', ctrl.index);
router.get('/mapa', ctrl.mapa);
router.get('/nuevo', verifyToken, ctrl.nuevo);
router.post('/', verifyToken, upload.array('fotos', 5), ctrl.store);
router.get('/:id', ctrl.show);
router.put('/:id', verifyToken, ctrl.update);
router.post('/:id/votar', verifyToken, ctrl.votar);
router.delete('/:id/votar', verifyToken, ctrl.quitarVoto);

module.exports = router;
