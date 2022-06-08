const express = require('express');
const controller = require('../controllers/questionnaire');

const router = express.Router();

router.get('/', controller.findAll);

router.get('/:id', controller.findOne);

router.post('/', controller.create);

router.delete('/:id', controller.remove);

router.patch('/:id', controller.update);

module.exports = router;