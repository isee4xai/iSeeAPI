const express = require('express');
const router = express.Router()
const adminuserCtrl = require('../controllers/adminuser');

//----------------------------------------------------
// Admin User Related Endpoints
//---------------------------------------------------
// Get all usecases
router.get('/companies', adminuserCtrl.company_list);
router.post('/company', adminuserCtrl.company_create);

module.exports = router;