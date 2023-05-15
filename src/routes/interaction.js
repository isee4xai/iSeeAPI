const express = require('express');
const controller = require('../controllers/interaction');
const { isCompanyUsecase } = require('../middlewares/validateCompany');

const router = express.Router();

// Usecase level Interactions
router.get('/usecase/:id',[isCompanyUsecase], controller.findAll);
router.post('/usecase/:id', [isCompanyUsecase] ,controller.create);

module.exports = router;