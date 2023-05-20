const express = require('express');
const router = express.Router()
const enduserCtrl = require('../controllers/enduser');

//----------------------------------------------------
// End User Related Endpoints
//---------------------------------------------------
// Get all usecases
router.get('/usecases', enduserCtrl.list);

module.exports = router;