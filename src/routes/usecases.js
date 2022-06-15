const express = require('express');
const router = express.Router()
const usecasectrl = require('../controllers/usecase');
const personactrl = require('../controllers/persona');
const intentctrl = require('../controllers/intent');

//----------------------------------------------------
// Usecase Related Endpoints
//---------------------------------------------------

// Create
router.post('/', usecasectrl.create);

// Update by ID
router.patch('/:id', usecasectrl.update);

// Get one
router.get('/:id', usecasectrl.get);

// Get all
router.get('/', usecasectrl.list);

// Update Settings
router.patch('/:id/settings', usecasectrl.updateSettings);

// Update published state
router.patch('/:id/publish', usecasectrl.updatePublish);

// Delete by ID
router.delete('/:id', usecasectrl.delete);


//----------------------------------------------------
// Persona Related Endpoints
//---------------------------------------------------

// Add Persona to Usecase
router.post('/:id/persona', personactrl.add);

// Update Persona Details
router.patch('/:id/persona/:personaId', personactrl.updateDetails);

// Delete Persona Details
router.delete('/:id/persona/:personaId', personactrl.delete);


//----------------------------------------------------
// Intent Related Endpoints
//---------------------------------------------------

// Add intent to Persona
router.post('/:id/persona/:personaId/intent', intentctrl.add);
router.delete('/:id/persona/:personaId/intent/:intentId', intentctrl.delete);
router.patch('/:id/persona/:personaId/intent/:intentId', intentctrl.update);

//----------------------------------------------------
// Stat Related Endpoints
//---------------------------------------------------

router.get('/:id/stats', usecasectrl.getStats);
router.get('/:id/persona/:personaId/:intent/stats', usecasectrl.getPersonaIntentStats);

module.exports = router;