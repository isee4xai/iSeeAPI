const express = require('express');
const controller = require('../controllers/interaction');
const { isCompanyUsecase } = require('../middlewares/validateCompany');
const authJwt = require('../middlewares/authJWT');

const router = express.Router();

// Usecase level Interactions
router.get('/usecase/:id', [authJwt.isDesignUser, isCompanyUsecase], controller.findAll);
router.get('/usecase/:id/json/:interactionId', [authJwt.isDesignUser, isCompanyUsecase], controller.getInteractionJSON);
router.post('/usecase/:id', [authJwt.isDesignUserOrEndUser, isCompanyUsecase], controller.create);

module.exports = router;