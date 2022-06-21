const express = require('express');
const router = express.Router()
const statsctrl = require('../controllers/stats');

//----------------------------------------------------
// Stat Related Endpoints
//---------------------------------------------------

router.get('/usecases/:id/', statsctrl.getStats);
router.get('/usecases/:id/persona/:personaId/:intent/', statsctrl.getPersonaIntentStats);

module.exports = router;