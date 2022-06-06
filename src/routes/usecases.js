const express = require('express');
const router = express.Router()
const usecasectrl = require('../controllers/usecase');
const personactrl = require('../controllers/persona');

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

module.exports = router;