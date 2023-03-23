const express = require('express');
const router = express.Router()
const usecasectrl = require('../controllers/usecase');
const personactrl = require('../controllers/persona');
const intentctrl = require('../controllers/intent');
const { isCompanyUsecase } = require('../middlewares/validateCompany');

//----------------------------------------------------
// Usecase Related Endpoints
//---------------------------------------------------

// Create
router.post('/', usecasectrl.create);

// Update by ID
router.patch('/:id', [isCompanyUsecase], usecasectrl.update);

// Get one
router.get('/:id', [isCompanyUsecase], usecasectrl.get);

// Get one with iSee casestructure JSON Format
router.get('/:id/casestructure', [isCompanyUsecase], usecasectrl.getCaseStructure);

router.get('/:id/dataset/count', [isCompanyUsecase], usecasectrl.getDatasetCount);
router.get('/:id/dataset/randomInstance', [isCompanyUsecase], usecasectrl.getRandomDataInstance);

router.post('/:id/model/explain', [isCompanyUsecase], usecasectrl.getExplainerResponse);
router.post('/:id/model/predict', [isCompanyUsecase], usecasectrl.getModelPredictResponse);

// Duplicated Above - Deprecate Later
router.get('/:id/sampleDataInstance', [isCompanyUsecase], usecasectrl.getRandomDataInstance);
router.post('/:id/explainerResponse', [isCompanyUsecase], usecasectrl.getExplainerResponse);
router.post('/:id/predictResponse', [isCompanyUsecase], usecasectrl.getModelPredictResponse);


// Get all
router.get('/', usecasectrl.list);

// Update Settings
router.patch('/:id/settings', [isCompanyUsecase], usecasectrl.updateSettings);

// Update Model
router.patch('/:id/model', [isCompanyUsecase], usecasectrl.updateModel);

// Update published state
router.patch('/:id/publish', [isCompanyUsecase], usecasectrl.updatePublish);

// Delete by ID
router.delete('/:id', [isCompanyUsecase], usecasectrl.delete);


//----------------------------------------------------
// Persona Related Endpoints
//---------------------------------------------------

// Add Persona to Usecase
router.post('/:id/persona', [isCompanyUsecase], personactrl.add);

// Update Persona Details
router.patch('/:id/persona/:personaId', [isCompanyUsecase], personactrl.updateDetails);

// Delete Persona Details
router.delete('/:id/persona/:personaId', [isCompanyUsecase], personactrl.delete);

//----------------------------------------------------
// Intent Related Endpoints
//---------------------------------------------------

// Add intent to Persona
router.post('/:id/persona/:personaId/intent', [isCompanyUsecase], intentctrl.add);
router.delete('/:id/persona/:personaId/intent/:intentId', [isCompanyUsecase], intentctrl.delete);
router.patch('/:id/persona/:personaId/intent/:intentId', [isCompanyUsecase], intentctrl.update);


module.exports = router;