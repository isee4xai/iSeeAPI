const express = require('express');
const router = express.Router()
const adminuserCtrl = require('../controllers/adminuser');

//----------------------------------------------------
// Admin User Related Endpoints
//---------------------------------------------------
// Get all usecases
router.get('/companies', adminuserCtrl.company_list);
router.post('/company', adminuserCtrl.company_create);
router.get('/company/:id', adminuserCtrl.company_get);
router.post('/company/:id/update', adminuserCtrl.company_update);
router.post('/company/:id/user_add', adminuserCtrl.company_user_add);
router.post('/company/:id/user_edit', adminuserCtrl.company_user_edit);
router.post('/company/:id/user_edit_pass', adminuserCtrl.company_user_edit_pass);

module.exports = router;