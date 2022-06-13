const express = require('express');
const router = express.Router()
const auth = require('../controllers/auth');
const personactrl = require('../controllers/persona');
const intentctrl = require('../controllers/intent');

//----------------------------------------------------
// User Related Endpoints
//---------------------------------------------------

// Remove in Production
// Create User
router.post('/create', auth.createDesignUserWithCompany);
router.post('/login', auth.login);

module.exports = router;