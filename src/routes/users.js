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
router.post('/login', auth.login);
router.post('/admin_create', auth.admin_createDesignUserWithCompany);
router.post('/admin_companies', auth.admin_companies);
router.post('/admin_add_user', auth.admin_add_user);
router.post('/admin_all_users', auth.admin_all_users);

// List all users
router.post('/admin_all_usecases', auth.admin_all_usecases);

// Change Usecase ownership
router.post('/admin_change_usecase_ownership', auth.admin_change_usecase_ownership);

// Change User company
router.post('/admin_change_user_company', auth.admin_change_user_company);

module.exports = router;