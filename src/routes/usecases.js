const express = require('express');
const router = express.Router()
const usecasectrl = require('../controllers/usecase');
const personactrl = require('../controllers/persona');
const intentctrl = require('../controllers/intent');
const { isCompanyUsecase } = require('../middlewares/validateCompany');
const { incrementVersion } = require('../middlewares/incrementVersion');

//----------------------------------------------------
// Usecase Related Endpoints
//---------------------------------------------------

// Create
router.post('/', usecasectrl.create);

// Update by ID
router.patch('/:id', [isCompanyUsecase], usecasectrl.update);

// Get one
router.get('/:id', [isCompanyUsecase], usecasectrl.get);

// Get all
router.get('/', usecasectrl.list);

// Update Settings
router.patch('/:id/settings', [isCompanyUsecase, incrementVersion], usecasectrl.updateSettings);

// Update Model
router.patch('/:id/model', [isCompanyUsecase, incrementVersion], usecasectrl.updateModel);

// Update published state
router.patch('/:id/publish', [isCompanyUsecase, incrementVersion], usecasectrl.updatePublish);

// Delete by ID
router.delete('/:id', [isCompanyUsecase], usecasectrl.delete);


//----------------------------------------------------
// Persona Related Endpoints
//---------------------------------------------------

// Add Persona to Usecase
router.post('/:id/persona', [isCompanyUsecase, incrementVersion], personactrl.add);

// Update Persona Details
router.patch('/:id/persona/:personaId', [isCompanyUsecase, incrementVersion], personactrl.updateDetails);

// Delete Persona Details
router.delete('/:id/persona/:personaId', [isCompanyUsecase, incrementVersion], personactrl.delete);

//----------------------------------------------------
// Intent Related Endpoints
//---------------------------------------------------

// Add intent to Persona
router.post('/:id/persona/:personaId/intent', [isCompanyUsecase, incrementVersion], intentctrl.add);
router.delete('/:id/persona/:personaId/intent/:intentId', [isCompanyUsecase, incrementVersion], intentctrl.delete);
router.patch('/:id/persona/:personaId/intent/:intentId', [isCompanyUsecase, incrementVersion], intentctrl.update);

//----------------------------------------------------
// Invitations Related Endpoints
//---------------------------------------------------
// Create
router.post('/:id/endusers/invite',[isCompanyUsecase], usecasectrl.createInvite);

// Update by ID
router.patch('/:id/endusers/invite', [isCompanyUsecase], usecasectrl.update);

// Get one
router.get('/:id/endusers/invites', [isCompanyUsecase], usecasectrl.getInvites);

// Change State
router.patch('/:id/endusers/invite/:inviteId/publish', [isCompanyUsecase], usecasectrl.updateInvitePublish);

module.exports = router;