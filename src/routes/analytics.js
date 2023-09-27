const express = require('express');
const router = express.Router()
const analyticsctrl = require('../controllers/analytics');

//----------------------------------------------------
// Analytics Related Endpoints
//---------------------------------------------------

router.get('/usecases/:id/', analyticsctrl.getAnalytics);

module.exports = router;