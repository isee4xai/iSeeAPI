const express = require('express');
const controller = require('../controllers/interaction');
const { isCompanyUsecase } = require('../middlewares/validateCompany');
const authJwt = require('../middlewares/authJWT');

const router = express.Router();

// Usecase level Interactions
router.get('/usecase/:id', [isCompanyUsecase, authJwt.isDesignUser], controller.findAll);
router.post('/usecase/:id', [isCompanyUsecase, authJwt.isDesignUserOrEndUser], controller.create);

module.exports = router;