const express = require('express');
const router = express.Router()
const cbr_cycle_ctrl = require('../controllers/cbr_cycle');
const { isCompanyUsecase } = require('../middlewares/validateCompany');

// Similar to update Query of an intent
router.post('/:id/persona/:personaId/intent/:intentId', [isCompanyUsecase], cbr_cycle_ctrl.query);
router.post('/:id/persona/:personaId/intent_default/:intentId/strategy/:strategyId', [isCompanyUsecase, incrementVersion], cbr_cycle_ctrl.setDefault);

// CBR Reuse Functions
router.post('/:id/persona/:personaId/intent/:intentId/reuse', [isCompanyUsecase], cbr_cycle_ctrl.reuse);
router.post('/:id/applicability', cbr_cycle_ctrl.explainerApplicability);
router.post('/:id/substituteSubtree', cbr_cycle_ctrl.substituteSubtree);
router.post('/:id/substituteExplainer', cbr_cycle_ctrl.substituteExplainer);

module.exports = router;