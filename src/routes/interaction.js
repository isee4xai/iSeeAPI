const express = require('express');
const controller = require('../controllers/interaction');
const { isCompanyUsecase } = require('../middlewares/validateCompany');
const authJwt = require('../middlewares/authJWT');

const router = express.Router();

// Usecase level Interactions
router.get('/usecase/:id', [authJwt.isDesignUser, isCompanyUsecase], controller.findAll);
router.post('/usecase/:id', [authJwt.isDesignUserOrEndUser, isCompanyUsecase], controller.create);

module.exports = router;