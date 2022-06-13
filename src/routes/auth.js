const express = require('express');
const router = express.Router()
const usecasectrl = require('../controllers/usecase');
const personactrl = require('../controllers/persona');
const intentctrl = require('../controllers/intent');

//----------------------------------------------------
// User Related Endpoints
//---------------------------------------------------

// Remove in Production
// Create User
router.post('/create', usecasectrl.create);


module.exports = router;