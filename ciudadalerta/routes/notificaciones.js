const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notifController');
const verifyToken = require('../middleware/verifyToken');

router.use(verifyToken);
router.get('/', ctrl.index);
router.post('/:id/leida', ctrl.marcarLeida);

module.exports = router;
