const express = require('express');
const router = express.Router()
const treectrl = require('../controllers/trees');

//----------------------------------------------------
// Trees Related Endpoints
//---------------------------------------------------

// Capital P to support the BT Editor Code
router.get('/Projects', treectrl.list);
router.get('/Projects/:id', treectrl.get)

router.post('/Projects', treectrl.create);
router.patch('/Projects/:id', treectrl.update)

module.exports = router;