const express = require('express');
const router = express.Router()
const usecasectrl = require('../controllers/usecase');
const { isCompanyUsecase } = require('../middlewares/validateCompany');

// Get one with iSee casestructure JSON Format
// Used in Dialog Manager ///////////////////////////////////////////////////////
router.get('/:id/casestructure', [isCompanyUsecase], usecasectrl.getCaseStructure);

router.get('/:id/dataset/count', [isCompanyUsecase], usecasectrl.getDatasetCount);
router.get('/:id/dataset/randomInstance', [isCompanyUsecase], usecasectrl.getRandomDataInstance);

router.post('/:id/model/explain', [isCompanyUsecase], usecasectrl.getExplainerResponse);
router.post('/:id/model/predict', [isCompanyUsecase], usecasectrl.getModelPredictResponse);
//////////////////////////////////////////////////////////////////////////////// 

module.exports = router;