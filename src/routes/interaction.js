const express = require('express');
const controller = require('../controllers/interaction');

const router = express.Router();

router.get('/', controller.findAll);
router.post('/', controller.create);

module.exports = router;